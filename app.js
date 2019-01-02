process.env['NTBA_FIX_319'] = 1;

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const Twitter = require('twitter');

const client = new Twitter({
  consumer_key: process.env.TWITTER_API_KEY,
  consumer_secret: process.env.TWITTER_API_SECRET_KEY,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;

const chat_id = process.env.CHAT_ID;

const userNames = [];

let currentMode = 'waiting';

const bot = new TelegramBot(token, {polling: true});
//VARS------------
const interval = 1000 * 1; /*minute*/
const sheduledHours = [15, 19, 21];
const notifyGroupRulesTime = [10, 13, 17];

const groupRulesText = 'Group rules';

const announceText =
  "Next round starts in 20 minutes, please get ready to submit your account handle. Do not post your handle until I've said to or else you'll miss the round";
const announceTime = 20; //before. It could be 1-59

const startCollectingText =
  'Comment your Twitter handle @accountname now to get added to the next engagement round'; //1
const startCollectingTextWithTimeLeft =
  '90 minutes left to comment your Twitter handle @accountname for inclusion in this engagement round'; //2
const delay = 1500; //before 1 and 2. ms

const thirtyMinsLeftText =
  '30 minutes left to comment your Twitter handle @accountname for inclusion in this engagement round';
const tenMinsLeftText =
  '10 minutes left to comment your Twitter handle @accountname for inclusion in this engagement round';

const likeTimeText =
  'The round starts now! Copy and paste each twitter url into your browser, then like or retweet on the most recent post for each account';
const likeEndText =
  'Round is closed, will check if everyone that joined the round liked/retweeted.';
//END VARS------------

let collecting_start_time;
let like_start_time;

setInterval(function() {
  const time_now = new Date();
  const current_hour = time_now.getHours();
  const current_min = time_now.getMinutes();
  const current_seconds = time_now.getSeconds();

  //group rules
  if (currentMode == 'waiting' && current_min == 0 && notifyGroupRulesTime.includes(current_hour)) {
    sendToGroup(groupRulesText);
  }

  if (
    currentMode == 'waiting' &&
    sheduledHours.includes(current_hour + 1) &&
    (current_min == 0 ? 60 : current_min) - announceTime == 40
  ) {
    //announce
    sendToGroup(announceText);
    currentMode = 'annotate';
  } else if (
    currentMode == 'annotate' &&
    sheduledHours.includes(current_hour) &&
    current_min == 0
  ) {
    //started collecting
    collecting_start_time = time_now;
    setTimeout(function() {
      sendToGroup(startCollectingTextWithTimeLeft);
    }, delay);
    sendToGroup(startCollectingText);
    currentMode = 'collecting';
  } else if (currentMode == 'collecting') {
    const r = getMinutesDiff(time_now, collecting_start_time);
    if (r == 60) {
      //before 30 mins 60
      sendToGroup(thirtyMinsLeftText);
    } else if (r == 80) {
      //before 10 mins 80
      sendToGroup(tenMinsLeftText);
    } else if (r == 90) {
      //finish like time 90
      collecting_start_time = 0;
      currentMode = 'liketime';
      sendToGroup(likeTimeText);
      like_start_time = time_now;
      setTimeout(function() {
        const list = getListMessage();
        sendToGroup(list, true);
      }, 1500);
    }
  } else if ((currentMode = 'liketime' && getMinutesDiff(time_now, like_start_time) >= 60)) {
    //LikeTime
    currentMode = 'waiting';
    list = [];
    sendToGroup(likeEndText);
    like_start_time = 0;
  }
}, interval);

bot.onText(/\/chatId/, msg => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'chatId:' + chatId);
});

bot.on('message', msg => {
  if (currentMode == 'collecting' && msg.text.startsWith('@')) {
    var text = msg.text.split(' ')[0];
    userNames.push(text);
  }
});

const getMinutesFromMileseconds = function(t) {
  if (!t) return 0;
  return Math.floor(t / 60000);
};

const getMinutesDiff = function(d1, d2) {
  if (!d1 || !d2) return 0;
  const mileseconds = Math.abs(d1 - d2);
  const res = getMinutesFromMileseconds(mileseconds);
  return res;
};
const getListMessage = function() {
  const res = '';
  for (var i = 0; i < userNames.length; i++) {
    var curName = userNames[i];
    res =
      res +
      '<a href="https://twitter.com/' +
      curName.substring(1, curName.length) +
      '">' +
      curName +
      '</a>\r\n';
  }
  return res;
};

const sendToGroup = function(text, html) {
  if (!text || chat_id == '') return;
  if (html) bot.sendMessage(chat_id, text, {parse_mode: 'HTML', disable_web_page_preview: 'true'});
  else bot.sendMessage(chat_id, text);
};
