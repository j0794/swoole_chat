var socket = new WebSocket('ws://127.0.0.1:9502');

function nls2nl(data) {
    if (data) {
        str = data.replace(/\r\n|\r|\n+/g,"\n");
        return str;
    };
};

function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, options = {}) {

    options = {
        path: '/',
        // при необходимости добавьте другие значения по умолчанию
        ...options
    };

    if (options.expires) {
        options.expires = options.expires.toUTCString();
    }

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
        updatedCookie += "; " + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }
    }

    document.cookie = updatedCookie;
}


function deleteCookie(name) {
    setCookie(name, "", {
        'max-age': -1
    })
}

var myUsername;

var myGuid = getCookie('guid');

socket.onopen = function() {
    console.log("Соединение установлено.");
    if (myGuid) {
        socket.send(JSON.stringify({name: 'existing user', body: {guid: myGuid}}));
    } else {
        socket.send(JSON.stringify({name: 'new user'}));
    };
};

socket.onclose = function(event) {
    if (event.wasClean) {
        console.log('Соединение закрыто чисто');
    } else {
        console.log('Обрыв соединения'); // например, "убит" процесс сервера
    }
    console.log('Код: ' + event.code + ' причина: ' + event.reason);
};


socket.onmessage = function(event) {
    var data = JSON.parse(event.data);
    // console.log("Получены данные " + data);
    // console.log(JSON.parse(data));
    // socket.send(JSON.stringify({name: 'test', body: '123'}));

    var data_name = data.name,
        data_body = data.body;

    switch (data_name) {
        case 'new message':
            var message = data_body.message;
            var chatHistory = document.querySelector('.chat-history-body');
            // if (chatHistory.childNodes.length < chat.length) {
            //     for (var i = 0; i < chat.length; i++) {
                    var chatHistoryItem = document.querySelector('#chat-history-'+(message.id));
                    var autoHistoryScroll;
                    if (chatHistory.scrollTop == (chatHistory.scrollHeight - chatHistory.clientHeight)) {
                        autoHistoryScroll = true;
                    } else {
                        autoHistoryScroll = false;
                    };
                    if (!chatHistoryItem) {
                        var newChatHistoryItem = document.createElement('div'),
                            newChatHistoryHeader = document.createElement('div'),
                            newChatHistoryUsername = document.createElement('div'),
                            newChatHistoryDate = document.createElement('div'),
                            newChatHistoryMessage = document.createElement('div'),
                            chatHistoryDate = new Date(parseInt(message.date)*1000),
                            formatterDate = new Intl.DateTimeFormat("ru", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                                second: "numeric"
                            });
                        newChatHistoryItem.classList.add('chat-history-item');
                        newChatHistoryItem.setAttribute('id','chat-history-'+(message.id));
                        newChatHistoryHeader.classList.add('chat-history-header');
                        newChatHistoryUsername.classList.add('chat-history-username');
                        newChatHistoryDate.classList.add('chat-history-date');
                        newChatHistoryMessage.classList.add('chat-history-message');
                        newChatHistoryUsername.textContent = nls2nl(message.username);
                        newChatHistoryDate.textContent = formatterDate.format(chatHistoryDate);
                        newChatHistoryHeader.insertBefore(newChatHistoryUsername, null);
                        newChatHistoryHeader.insertBefore(newChatHistoryDate, null);
                        newChatHistoryMessage.textContent = nls2nl(message.message);
                        newChatHistoryItem.insertBefore(newChatHistoryHeader, null);
                        newChatHistoryItem.insertBefore(newChatHistoryMessage, null);
                        chatHistory.insertBefore(newChatHistoryItem, null);
                    };
                    if (autoHistoryScroll) {
                        chatHistory.scrollTop = chatHistory.scrollHeight - chatHistory.clientHeight;
                    };
                // };
            // };
            break;
        case 'chat list':
            var chat_list = data_body.chat_list;
            var chatHistory = document.querySelector('.chat-history-body');
            // if (chatHistory.childNodes.length < chat.length) {
            for (var message_id in chat_list) {
                var message = chat_list[message_id];
                var chatHistoryItem = document.querySelector('#chat-history-'+(message.id));
                var autoHistoryScroll;
                if (chatHistory.scrollTop == (chatHistory.scrollHeight - chatHistory.clientHeight)) {
                    autoHistoryScroll = true;
                } else {
                    autoHistoryScroll = false;
                };
                if (!chatHistoryItem) {
                    var newChatHistoryItem = document.createElement('div'),
                        newChatHistoryHeader = document.createElement('div'),
                        newChatHistoryUsername = document.createElement('div'),
                        newChatHistoryDate = document.createElement('div'),
                        newChatHistoryMessage = document.createElement('div'),
                        chatHistoryDate = new Date(parseInt(message.date)*1000),
                        formatterDate = new Intl.DateTimeFormat("ru", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            second: "numeric"
                        });
                    newChatHistoryItem.classList.add('chat-history-item');
                    newChatHistoryItem.setAttribute('id','chat-history-'+(message.id));
                    newChatHistoryHeader.classList.add('chat-history-header');
                    newChatHistoryUsername.classList.add('chat-history-username');
                    newChatHistoryDate.classList.add('chat-history-date');
                    newChatHistoryMessage.classList.add('chat-history-message');
                    newChatHistoryUsername.textContent = nls2nl(message.username);
                    newChatHistoryDate.textContent = formatterDate.format(chatHistoryDate);
                    newChatHistoryHeader.insertBefore(newChatHistoryUsername, null);
                    newChatHistoryHeader.insertBefore(newChatHistoryDate, null);
                    newChatHistoryMessage.textContent = nls2nl(message.message);
                    newChatHistoryItem.insertBefore(newChatHistoryHeader, null);
                    newChatHistoryItem.insertBefore(newChatHistoryMessage, null);
                    chatHistory.insertBefore(newChatHistoryItem, null);
                };
                if (autoHistoryScroll) {
                    chatHistory.scrollTop = chatHistory.scrollHeight - chatHistory.clientHeight;
                };
            };
            // };
            break;
        case 'new guid':
            var guid = data_body.guid;
            setCookie('guid', guid, {'max-age': 15552000});
            break;
        case 'online userlist':
            var online_users = data_body.online_users;
            var userlist = document.querySelector('.userlist');
            for (var client_id in online_users) {
                var online_user = online_users[client_id],
                    usernameBlock = document.getElementById(client_id);
                if (!usernameBlock && online_user.username) {
                    var userlistItem = document.createElement('div');
                    userlistItem.classList.add('userlist-item');
                    userlistItem.setAttribute('id',client_id);
                    userlistItem.textContent = online_user.username;
                    userlist.insertBefore(userlistItem, null);
                } else if (usernameBlock && online_user.username && (usernameBlock.textContent != online_user.username)) {
                    usernameBlock.textContent = online_user.username;
                };
            };
            break;
            // var userlistItems = document.querySelectorAll('.userlist-item');
            // for (var i = userlistItems.length - 1; i >= 0; i--) {
            //     if (!onlineUsers[userlistItems[i].getAttribute('id')]) {
            //         userlistItems[i].parentNode.removeChild(userlistItems[i]);
            //     };
            // };
        case 'change username':
            var username = data_body.username;
            myUsername = username;
            document.querySelector('.field').value = myUsername;
            break;
        case 'set username error':
            alert( "Такой уже есть" );
            break;
        case 'update username':
            var user = data_body.user;
            var user_in_list = document.getElementById(user.id);
            user_in_list.textContent = user.username;
            var users_in_chat = document.querySelectorAll('.chat-history-username');
            for (var user_in_chat of users_in_chat) {
                if (user_in_chat.textContent == user.old_username) {
                    user_in_chat.textContent = user.username;
                }
            };
            break;
        case 'update userlist':
            var user = data_body.user;
            var userlist = document.querySelector('.userlist');
            var usernameBlock = document.getElementById(user.id);
            if (!usernameBlock && user.username) {
                var userlistItem = document.createElement('div');
                userlistItem.classList.add('userlist-item');
                userlistItem.setAttribute('id',user.id);
                userlistItem.textContent = user.username;
                userlist.insertBefore(userlistItem, null);
            } else if (usernameBlock && user.username && (usernameBlock.textContent != user.username)) {
                usernameBlock.textContent = user.username;
            };
            break;
        case 'del user':
            var user = data_body.user;
            var usernameBlock = document.getElementById(user.id);
            usernameBlock.remove();
            break;
    };
};

socket.onerror = function(error) {
    console.log("Ошибка " + error.message);
};


document.querySelector('.form').addEventListener('submit', function (e) {
    e.preventDefault();
    var field = document.querySelector('.field').value;
    if (field != '') {
        socket.send(JSON.stringify({name: 'set username', body: {username: field}}));
    };
});

function sendMessage() {
    var field = document.querySelector('.chat-field').value;
    if (myUsername && field != '') {
        var trimmedField = field.substring(0, 1000);
        socket.send(JSON.stringify({name: 'send message', body: {message: trimmedField}}));
        document.querySelector('.chat-field').value = '';
    };
};

document.querySelector('.chat-form').addEventListener('submit', function (e) {
    e.preventDefault();
    sendMessage();
});

document.querySelector('.chat-field').addEventListener('keydown', function (e) {
    if ((e.which || e.keyCode) == 13) {
        e.preventDefault();
        sendMessage();
    };
});