exports.identifier = 'page-filemanager';

exports.title = 'i18n-File-Manager';

exports.route = '/filemanager*';

exports.selector = 'div.filemanager';

exports.selectable = '.filemanager div.row > a.js-selectable';

exports.mount = '/filemanager';

exports.root = 'public/files';

exports.serve = '/files';

exports.up = true;

exports.down = true;

exports.icons = true;

exports.crumbs = true;

exports.place = process.env.GLINT_PLACE || 'browser';

