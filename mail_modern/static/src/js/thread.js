odoo.define('mail_modern.thread', function (require) {
    "use strict";
    var core = require('web.core');
    var QWeb = core.qweb;
    var thread = require('mail.ChatThread');
    var time = require('web.time');

    var
        _t = core._t;

    var ORDER = {
        ASC: 1,
        DESC: -1,
    };


    thread.include({


        events: {
            "click a": "on_click_redirect",
            "click img": "on_click_redirect",
            "click strong": "on_click_redirect",
            "click .o_thread_show_more": "on_click_show_more",
            "click .o_attachment_download": "_onAttachmentDownload",
            "click .o_attachment_view": "_onAttachmentView",
            "click .o_thread_message_needaction": function (event) {
                var message_id = $(event.currentTarget).data('message-id');
                this.trigger("mark_as_read", message_id);
            },
            "click .o_thread_message_star": function (event) {
                var message_id = $(event.currentTarget).data('message-id');
                this.trigger("toggle_star_status", message_id);
            },
            "click .o_thread_message_reply": function (event) {
                this.selected_id = $(event.currentTarget).data('message-id');
                this.$('.o_thread_message').removeClass('o_thread_selected_message');
                this.$('.o_thread_message[data-message-id="' + this.selected_id + '"]')
                    .addClass('o_thread_selected_message');
                this.trigger('select_message', this.selected_id);
                event.stopPropagation();
            },
             "click .coll .o_thread_message_core": function (event) {
                event.preventDefault();
                var itemSelect = $(event.currentTarget).find(".o_thread_message_sidebar_small");
                if (itemSelect.hasClass("hide"))
                    itemSelect.removeClass('hide');
                else
                    itemSelect.addClass('hide');
            },
            "click .o_thread_message": function (event) {
                $(event.currentTarget).toggleClass('o_thread_selected_message');
            },
            "click": function () {
                if (this.selected_id) {
                    this.unselect();
                    this.trigger('unselect_message');
                }
            },
        },

        render: function (messages, options) {
            var self = this;
            var msgs = _.map(messages, this._preprocess_message.bind(this));
            if (this.options.display_order === ORDER.DESC) {
                msgs.reverse();
            }
            options = _.extend({}, this.options, options);

            // Hide avatar and info of a message if that message and the previous
            // one are both comments wrote by the same author at the same minute
            // and in the same document (users can now post message in documents
            // directly from a channel that follows it)
            var prev_msg;
            _.each(msgs, function (msg) {
                if (!prev_msg || (Math.abs(msg.date.diff(prev_msg.date)) > 60000) ||
                    prev_msg.message_type !== 'comment' || msg.message_type !== 'comment' ||
                    (prev_msg.author_id[0] !== msg.author_id[0]) || prev_msg.model !== msg.model ||
                    prev_msg.res_id !== msg.res_id) {
                    msg.display_author = true;
                } else {
                    msg.display_author = !options.squash_close_messages;
                }
                prev_msg = msg;
            });

            this.$el.html(QWeb.render('mail.ChatThread', {
                messages: msgs,
                options: options,
                ORDER: ORDER,
                date_format: time.getLangDatetimeFormat(),
            }));

            this.attachments = _.uniq(_.flatten(_.map(messages, 'attachment_ids')));

            _.each(msgs, function (msg) {
                var $msg = self.$('.o_thread_message[data-message-id="' + msg.id + '"]');
                $msg.find('.o_mail_timestamp').data('date', msg.date);

                self.insert_read_more($msg);
            });

            if (!this.update_timestamps_interval) {
                this.update_timestamps_interval = setInterval(function () {
                    self.update_timestamps();
                }, 1000 * 60);
            }
        },

    });

});
