process.env['NTBA_FIX_319'] = 1;

const app = require('express')();

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log('Server started on port ' + PORT);

  require('./routes/health')(app);
  require('./telegramBot')();
});

process.on('uncaughtException', function(error) {
  console.log('\x1b[31m', 'Exception: ', error, '\x1b[0m');
});

process.on('unhandledRejection', function(error, p) {
  console.log('\x1b[31m', 'Error: ', error.message, '\x1b[0m');
});
