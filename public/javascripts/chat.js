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
            console.log($username);
            if(!users[$username]) {
                socket.emit('new user', $username, function(data){
                    if(data){
                        $('#nickWrap').hide();
                        $('.userlist').show();
                    } else{
                        $nickError.html('That username is already taken!  Try again.');
                    }
                });
            }
        }
        if(data.user) {
            var chat = $('#chat_' + data.user);
            chat.find('#message-text').prop('disabled', true);
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
        var text = $(chat).find('#message-text');

        chat.attr({'id' : chatID});
        chat.removeClass('hide');
        chat.find('.chatwith').html(data.to);
        $(chat).draggable({ scroll: true, cancel: '.modal-body'});
        $(chat).find('button.close').on('click', function() {
            $(chat).hide();
        });
        $('body').append(chat);

        $(chat).submit(function(e) {
            e.preventDefault();

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

                var lastMessage = $(chat).find('.messages');
                var time = $('<small/>').html(d.yyyymmddhhm());
                lastMessage.append(time);
                var msg = $('<p />');
                var login = $('<strong/>').text($username);
                msg.addClass('alert alert-success').attr('role', 'alert');
                msg.text(text.val());
                msg.prepend(login);
                lastMessage.append(msg);
                $(lastMessage).scrollTop($(lastMessage)[0].scrollHeight);
                text.val('');
            }
        });
    }

    var addMessage = function(data) {

        if($('#' + data.id).length == 0) {
            //$('ul').find('[data-username="' + data.from + '"]').trigger('click');
            data.to = data.from;
            data.id = 'chat_' + data.from;
            windowChatUser(data);
        }
        var time = $('<small/>').html(data.time);
        var lastMessage = $('#' + data.id).find('.messages');
        lastMessage.append(time);
        var login = $('<strong/>').text(data.from);
        var msg = $('<p />').addClass('alert alert-info').attr('role', 'alert');
        msg.text(data.msg);
        msg.prepend(login);
        lastMessage.append(msg);
        $(lastMessage).scrollTop($(lastMessage)[0].scrollHeight);
    }

});