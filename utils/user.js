const users = [];

const userJoin = (id, username, room) => {
  const user = { id, username, room };

  users.push(user);
  return user;
};


const userLeave = (id) => {
    const index = users.findIndex((user) => user.id === id);

    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
};


const getUsers = (room) => {
    const RoomUsers = [];
    users.map((user) => {
        if (user.room == room) {
            RoomUsers.push(user);
        }
    });

  return RoomUsers;
};

module.exports = {
    userJoin,
    userLeave,
    getUsers,
};