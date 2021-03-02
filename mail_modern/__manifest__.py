# -*- coding: utf-8 -*-
{
    'name': "Mail modern view",

    'summary': """Modern presentation of the messages of your discussion""",

    'description': """ 
    """,

    'author': "Nusyce LTD",

    'category': 'Discuss',
    'version': '1.0',
    'price': 65,
    'currency': 'EUR',
    'license': 'AGPL-3',
    'installable': True,
    'application': False,
    'images': ['images/6.PNG', 'images/4.PNG'],
    'data': [
        'views/modern_mail.xml',
    ],
    'qweb': [
        'static/src/xml/thread.xml',
    ],

    # any module necessary for this one to work correctly
    'depends': ['base', 'mail']

}
