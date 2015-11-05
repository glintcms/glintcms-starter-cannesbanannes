exports.identifier = 'page-upload';

exports.selector = 'form.dropzone';

exports.get = '/upload*';

exports.post = '/upload*';

exports.ckeditor = '/ckeditor-upload*';

exports.limit = '10gb';

exports.place = process.env.GLINT_PLACE || 'server';




