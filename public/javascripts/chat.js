/**
 * Created by sebastian on 02.04.15.
 */
Date.prototype.yyyymmddhhm = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    var hh = this.getHours().toString();
    var m = this.getMinutes().toString();
    var secondStr = "0" + this.getSeconds();
    var second = secondStr.replace(/^.+(..)$/, "$1");

    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]) + ' ' + (hh + ':' + m + ':' + second); // padding
};

jQuery(function($){
    var socket = io.connect(null,
        {
            'reconnect': true,
            'reconnection delay': 500,
            'max reconnection attempts': 10
        }
    );
    var $nickForm = $('#setNick');
    var $nickError = $('#nickError');
    var $nickBox = $('#nickname');
    var $users = $('#users ul');
    var $chat = $('#chat');
    var $username = '';

    $nickForm.submit(function(e){
        e.preventDefault();

        if($nickBox.val().length == 0) {
            return false;
        }

        var login = $('p').text($nickBox.val()).html();
        socket.emit('new user', login, function(data){
            if(data){
                $('#nickWrap').hide();
                $('.userlist').show();
            } else{
                $nickError.html('That username is already taken!  Try again.');
            }
        });
        //$nickBox.val('');
    });

    socket.on('usernames', function(data){
        $users.html('');

        data.forEach(function(username) {
            var user = $('<li />');
            user.attr('data-username', username);
            user.addClass('glyphicon glyphicon-user');
            if ($nickBox.val() == username) {
                user.attr('data-me', true)
                $username = username;
            }else {
                user.on('click', windowChatUser.bind(null, {'from': $nickBox.val(), 'to': username, 'id': 'chat_' + username}));

            }
            user.append(username);

            $users.append(user);

        });
    });

    socket.on('whisper', function(data){
        addMessage(data);

    });

    socket.on('disconnect', function(data) {
        if(!data) {
            socket.socket.reconnect();
            if(!users[$username]) {
                socket.emit('new user', $username, function(data){
                    if(data){
                        $('#nickWrap').hide();
                        $('.userlist').show();
                        var chat = $('#chat_' + data.user);
                        $(chat).find('.message_input').prop('disabled', false);

                    } else{
                        $nickError.html('That username is already taken!  Try again.');
                    }
                });
            }
        }
        if(data.user) {
            var chat = $('#chat_' + data.user);
            chat.find('.message_input').prop('disabled', true);
        }
    });

    var windowChatUser = function(data) {

        if($('#' + data.id).length > 0) {
            $('#' + data.id).show();
            return false;
        }

        console.log(data.id);

        var chatID = 0;
        if (data.id) {
            chatID = data.id;
        } else {
            chatID = ('chat_' + data.from);
        }
        var chat = $('#template').clone();
        var text = $(chat).find('.message_input');

        chat.attr({'id' : chatID});
        chat.removeClass('hide');
        chat.find('.chatwith').html(data.to);
        $(chat).find('#x_button').on('click', function() {
            $(chat).hide();
        });
        $('.chats').append(chat);

        $(chat).find('.message_input').keyup(function(e) {
            if(e.keyCode == 13) {
                if (data.to && text.val().length > 0) {
                    var d = new Date();

                    socket.emit('send message', {
                        msg: text.val(),
                        from: $username,
                        to: data.to,
                        id: chatID,
                        time: d.yyyymmddhhm()
                    }, function (data) {
                        $chat.append('<span class="error">' + data + "</span><br/>");
                    });
                    data.time = d.yyyymmddhhm();
                    createMsg(data.time, chat, text.val(), $username);
                    text.val('');
                }
            };
        });
    }

    var createMsg = function(time, chat, text, from) {
        var lastMessage = $(chat).find('.messages');
        var time = $('<small/>').html(time);
        lastMessage.append(time);
        var msg = $('<div />').addClass('message');
        var login = $('<span/>').addClass('label label-info').text(from);
        msg.text(text);
        msg.prepend(login);
        lastMessage.append(msg);
        $(lastMessage).scrollTop($(lastMessage)[0].scrollHeight);
        $(chat).find('.message_input').removeAttr('disabled');
    }

    var addMessage = function(data) {

        if($('#' + data.id).length == 0) {
            data.to = data.from;
            data.id = 'chat_' + data.from;
            windowChatUser(data);
        }
        createMsg(data.time, $('#' + data.id), data.msg, data.from);
    }

});