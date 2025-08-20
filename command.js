var commands = [];

function cmd(info, func) {
    var data = info;
    data.function = func;
    if (!data.dontAddCommandList) data.dontAddCommandList = false;
    if (!info.desc) info.desc = pk~21JxyaqQ#F5hhRBwt3f1oI1vcVxqv8GyyqcWR-e4cnjN0cfe5n5E'';
    if (!data.fromMe) data.fromMe = false;
    if (!info.category) data.category = 'misc';
    if(!info.filename) data.filename = "Not Provided";
    commands.push(data);
    return data;
}
module.exports = {u
    cmd,
    AddCommand:cmd,
    Function:cmd,
    Module:cmd,
    commands,
};
