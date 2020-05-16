<?php
$server = new Swoole\Websocket\Server("127.0.0.1", 9502);

$server->on('open', function($server, $req) {
    echo "connection open: {$req->fd}\n";
    $server->push($req->fd, json_encode(["hello", "world"]));
});

if (!function_exists('guidGenerator')) {
    function guidGenerator() {
        if (!function_exists('S4')) {
            function S4() {
                return substr(strval(((1+rand()/getrandmax())*0x10000)|0), 1);
            };
        };
        return (S4().S4()."-".S4()."-".S4()."-".S4()."-".S4().S4().S4());
    };
};

if (!function_exists('trim')) {
    function trim($str) {
        $str = preg_replace('/^\s\s*/', '', $str);
        $str = preg_replace('/\s\s*$/', '', $str);
        return $str;
    };
};

$onlineUsers = new Swoole\Table(1024);
$onlineUsers->column('id', Swoole\Table::TYPE_INT);
$onlineUsers->column('username', Swoole\Table::TYPE_STRING, 64);
$onlineUsers->create();
$chat = new Swoole\Table(1024);
$chat->column('id', Swoole\Table::TYPE_INT);
$chat->column('date', Swoole\Table::TYPE_INT);
$chat->column('guid', Swoole\Table::TYPE_STRING, 64);
$chat->column('message', Swoole\Table::TYPE_STRING, 2048);
$chat->create();
$users = new Swoole\Table(1024);
$users->column('username', Swoole\Table::TYPE_STRING, 64);
$users->create();
$socketIds = new Swoole\Table(1024);
$socketIds->column('guid', Swoole\Table::TYPE_STRING, 64);
$socketIds->create();

$server->on('message', function($server, $frame) use ($users, $socketIds, $onlineUsers, $chat) {
//    echo "received message: {$frame->data}\n";
    $client_id = $frame->fd;
    $data = json_decode($frame->data);
    $data_name = $data->name;
    if (!empty($data->body)) {
        $data_body = $data->body;
    };

    if (!function_exists('server_push')) {
        $server_push = function($client_id, $data_name, $data_body = null) use ($server) {
            $server->push($client_id, json_encode([
                'name' => $data_name,
                'body' => $data_body
            ]));
        };
    };

    switch ($data_name) {
        case 'existing user':
            $guid = $data_body->guid;
            if ($users->exist($guid)) {
                $socketIds[$client_id] = [
                    'guid' => $guid
                ];
                $onlineUsers[$client_id] = [
                    'id' => $client_id,
                    'username' => $users[$guid]['username']
                ];
                if ($users[$guid]['username'] != 'Неизвестный верстальщик') {
                    $server_push($client_id, 'change username', ['username' => $users[$guid]['username']]);
                };
                $userlist = [];
                foreach ($onlineUsers as $onlineUserId => $row) {
                    $userlist[$onlineUserId] = $row;
                };
                $server_push($client_id, 'online userlist', ['online_users' => $userlist]);
                $chat_list = [];
                foreach ($chat as $message_id => $row) {
                    $chat_list[$message_id] = [
                        'id' => $row['id'],
                        'date' => $row['date'],
                        'username' => $users[$row['guid']]['username'],
                        'message' => $row['message']
                    ];
                };
                $server_push($client_id, 'chat list', ['chat_list' => $chat_list]);
                foreach ($onlineUsers as $onlineUserId => $onlineUser) {
                    $server_push($onlineUserId, 'update userlist', ['user' => [
                        'id' => $client_id,
                        'username' => $users[$guid]['username']
                    ]]);
                };
                break;
            } else {
                $server_push($client_id, 'user not exist');
            };
        case 'new user':
            do {
                $guid = guidGenerator();
            } while ($users->exist($guid));
            $users[$guid] = [
                'username' => 'Неизвестный верстальщик'
            ];
            $socketIds[$client_id] = [
                'guid' => $guid
            ];
            $onlineUsers[$client_id] = [
                'id' => $client_id,
                'username' => $users[$guid]['username']
            ];
            $server_push($client_id, 'new guid', ['guid' => $guid]);
            $userlist = [];
            foreach ($onlineUsers as $onlineUserId => $row) {
                $userlist[$onlineUserId] = $row;
            };
            $server_push($client_id, 'online userlist', ['online_users' => $userlist]);
            $chat_list = [];
            foreach ($chat as $message_id => $row) {
                $chat_list[$message_id] = [
                    'id' => $row['id'],
                    'date' => $row['date'],
                    'username' => $users[$row['guid']]['username'],
                    'message' => $row['message']
                ];
            };
            $server_push($client_id, 'chat list', ['chat_list' => $chat_list]);
            foreach ($onlineUsers as $onlineUserId => $onlineUser) {
                $server_push($onlineUserId, 'update userlist', ['user' => [
                    'id' => $client_id,
                    'username' => $users[$guid]['username']
                ]]);
            };
            break;
        case 'send message':
            $message = trim($data_body->message);
            if ($message != '') {
                $userGuid = $socketIds[$client_id]['guid'];
                $messageDate = time();
                $chat_count = $chat->count();
                $chat[$chat_count] = [
                    'id' => $chat_count + 1,
                    'date' => $messageDate,
                    'guid' => $userGuid,
                    'message' => $message
                ];
            };
            foreach ($onlineUsers as $onlineUserId => $onlineUser) {
                $server_push($onlineUserId, 'new message', ['message' => [
                        'id' => $chat[$chat_count]['id'],
                        'date' => $chat[$chat_count]['date'],
                        'username' => $users[$chat[$chat_count]['guid']]['username'],
                        'message' => $chat[$chat_count]['message']
                    ]
                ]);
            };
            break;
        case 'set username':
            $username = trim($data_body->username);
            if ($username != '') {
                foreach ($users as $user) {
                    if (strtolower($user['username']) == strtolower($username)) {
                        $server_push($client_id, 'set username error');
                        break 2;
                    };
                };
                $userGuid = $socketIds[$client_id]['guid'];
                $old_username = $users[$userGuid]['username'];
                $users[$userGuid]['username'] = $username;
                $onlineUsers[$client_id]['username'] = $username;
                $server_push($client_id, 'change username', ['username' => $users[$userGuid]['username']]);
                foreach ($onlineUsers as $onlineUserId => $row) {
                    $server_push($onlineUserId, 'update username', ['user' => [
                        'id' => $client_id,
                        'username' => $username,
                        'old_username' => $old_username
                    ]]);
                };
            };
            break;
        case 'test':

            break;
    }
});

$server->on('close', function($server, $fd) use ($onlineUsers) {
    if (!function_exists('server_push')) {
        $server_push = function($client_id, $data_name, $data_body = null) use ($server) {
            $server->push($client_id, json_encode([
                'name' => $data_name,
                'body' => $data_body
            ]));
        };
    };
    $onlineUsers->del($fd);
    foreach ($onlineUsers as $onlineUserId => $row) {
        $server_push($onlineUserId, 'del user', ['user' => [
            'id' => $fd
        ]]);
    };
    echo "connection close: {$fd}\n";
});

$server->start();
