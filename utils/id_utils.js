const idGenerator = () => {
    var S4 = () => {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };

    return (
      S4() +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      S4() +
      S4()
    );
};

const createNewId = (rooms) => {
  let newRoomId = idGenerator();

  rooms.forEach((room) => {
    if (room.id == newRoomId) newRoomId = createNewId(rooms);
  })

  return newRoomId;
}

module.exports = {idGenerator, createNewId}