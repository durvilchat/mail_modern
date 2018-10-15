odoo.define('mail_modern.thread', function (require) {
    "use strict";
    var core = require('web.core');
    var QWeb = core.qweb;
    var Session = require('web.Session');
    var thread = require('mail.widget.Thread');
    var time = require('web.time');

    var
        _t = core._t;

    var ORDER = {
        ASC: 1,
        DESC: -1,
    };


    thread.include({


        events: {
            'click a': '_onClickRedirect',
            'click img': '_onClickRedirect',
            'click strong': '_onClickRedirect',
            'click .o_thread_show_more': '_onClickShowMore',
            'click .o_attachment_download': '_onAttachmentDownload',
            'click .o_attachment_view': '_onAttachmentView',
            'click .o_thread_message_needaction': '_onClickMessageNeedaction',
            'click .o_thread_message_star': '_onClickMessageStar',
            'click .o_thread_message_reply': '_onClickMessageReply',
            'click .oe_mail_expand': '_onClickMailExpand',
            'click .o_thread_message': '_onClickMessage',
            'click': '_onClick',
            'click .o_thread_message_email_exception': '_onClickEmailException',
            'click .o_thread_message_email_bounce': '_onClickEmailException',
            'click .o_thread_message_moderation': '_onClickMessageModeration',
            'change .moderation_checkbox': '_onChangeModerationCheckbox',
            "click .coll .o_thread_message_core": function (event) {
                event.preventDefault();
                var itemSelect = $(event.currentTarget).find(".o_thread_message_sidebar_small");
                if (itemSelect.hasClass("hide"))
                    itemSelect.removeClass('hide');
                else
                    itemSelect.addClass('hide');
            },
        },

        render: function (thread, options) {
            var self = this;


            var shouldScrollToBottomAfterRendering = false;
            if (this._currentThreadID === thread.getID() && this.isAtBottom()) {
                shouldScrollToBottomAfterRendering = true;
            }
            this._currentThreadID = thread.getID();

            // copy so that reverse do not alter order in the thread object
            var messages = _.clone(thread.getMessages({domain: options.domain || []}));

            var modeOptions = options.isCreateMode ? this._disabledOptions :
                this._enabledOptions;

            // attachments ordered by messages order (increasing ID)
            this.attachments = _.uniq(_.flatten(_.map(messages, function (message) {
                return message.getAttachments();
            })));

            options = _.extend({}, modeOptions, options, {
                selectedMessageID: this._selectedMessageID,
            });

            // dict where key is message ID, and value is whether it should display
            // the author of message or not visually
            var displayAuthorMessages = {};

            // Hide avatar and info of a message if that message and the previous
            // one are both comments wrote by the same author at the same minute
            // and in the same document (users can now post message in documents
            // directly from a channel that follows it)
            var prevMessage;
            _.each(messages, function (message) {
                if (
                    // is first message of thread
                !prevMessage ||
                // more than 1 min. elasped
                (Math.abs(message.getDate().diff(prevMessage.getDate())) > 60000) ||
                prevMessage.getType() !== 'comment' ||
                message.getType() !== 'comment' ||
                // from a different author
                (prevMessage.getAuthorID() !== message.getAuthorID()) ||
                (
                    // messages are linked to a document thread
                    (
                        prevMessage.isLinkedToDocumentThread() &&
                        message.isLinkedToDocumentThread()
                    ) &&
                    (
                        // are from different documents
                        prevMessage.getDocumentModel() !== message.getDocumentModel() ||
                        prevMessage.getDocumentID() !== message.getDocumentID()
                    )
                )
                ) {
                    displayAuthorMessages[message.getID()] = true;
                } else {
                    displayAuthorMessages[message.getID()] = !options.squashCloseMessages;
                }
                prevMessage = message;
            });

            if (modeOptions.displayOrder === ORDER.DESC) {
                messages.reverse();
            }

            this.$el.html(QWeb.render('mail.widget.Thread', {
                thread: thread,
                displayAuthorMessages: displayAuthorMessages,
                options: options,
                ORDER: ORDER,
                dateFormat: time.getLangDatetimeFormat(),
            }));

            // must be after mail.widget.Thread rendering, so that there is the
            // DOM element for the 'is typing' notification bar
            if (thread.hasTypingNotification()) {
                this.renderTypingNotificationBar(thread);
            }

            _.each(messages, function (message) {
                var $message = self.$('.o_thread_message[data-message-id="' + message.getID() + '"]');
                $message.find('.o_mail_timestamp').data('date', message.getDate());

                self._insertReadMore($message);
            });

            if (shouldScrollToBottomAfterRendering) {
                this.scrollToBottom();
            }

            if (!this._updateTimestampsInterval) {
                this.updateTimestampsInterval = setInterval(function () {
                    self._updateTimestamps();
                }, 1000 * 60);
            }


            this._renderMessageMailPopover(messages);
        },
        /**
         * Scrolls the thread to a given message
         *
         * @param {integer} options.messageID the ID of the message to scroll to
         * @param {integer} [options.duration]
         * @param {boolean} [options.onlyIfNecessary]
         */
        scrollToMessage: function (options) {
            var $target = this.$('.o_thread_message[data-message-id="' + options.msgID + '"]'); 
            if (options.onlyIfNecessary) {
                var delta = $target.parent().height() - $target.height();
                var offset = delta < 0 ?
                    0 :
                    delta - ($target.offset().top
                    - $target.offsetParent().offset().top);
                offset = -Math.min(offset, 0);
                this.$el.scrollTo("+=" + offset + "px", options.duration);
            } else if ($target.length) {
                this.$el.scrollTo($target);
            }
        },

    });

});
