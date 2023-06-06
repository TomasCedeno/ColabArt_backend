const express = require("express");
const http = require("http");
const cors = require("cors");
const fs = require('fs');

const { userJoin, getUsers, userLeave } = require("./utils/user");
const { createNewId } = require("./utils/id_utils")

const app = express();
const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server);


//Middleware
app.use(express.json())

app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => {
    res.send("server");
});



//API Salas

//Crear Sala
app.post("/rooms", (req, res) => {
    fs.readFile('rooms.json',(err,data)=>{

        if (err) {
            console.log("Error no se puede leer el archivo", err);
        }
        const rooms = JSON.parse(data);
        
        req.body.id = createNewId(rooms)
        rooms.push(req.body);

        const newRoom = JSON.stringify(rooms, null, 2);
        
        fs.writeFile('rooms.json',newRoom, (err)=>{
            if (err) {
                console.log("Ha ocurrido un error al escribir en el archivo", err);
            }

            return res.status(200).send({message:"new room created", roomId:req.body.id});
        })
    })
});

//Obtener Salas por propietario
app.get('/rooms/owner/:id', (req,res) =>{
    const ownerId = req.params.id

    fs.readFile('rooms.json',(error,file)=>{
        if (error) {
            console.log("No se puede leer el archivo",error);
        }
        const rooms = JSON.parse(file);  

        const roomsByOwner = rooms.filter((room) => room.ownerId == Number(ownerId))

        return res.json(roomsByOwner)  
    })
})

//Obtener Salas por colaborador
app.get('/rooms/collaborator/:id', (req,res) =>{
    const collaboratorId = req.params.id

    fs.readFile('rooms.json',(error,file)=>{
        if (error) {
            console.log("No se puede leer el archivo",error);
        }
        const rooms = JSON.parse(file);  

        const roomsByCollaborators = rooms.filter((room) => room.collaborators.includes(Number(collaboratorId)))

        return res.json(roomsByCollaborators)  
    })
})

//Obtiene Sala por su id
app.get('/rooms/exists/:id', (req,res) =>{
    const roomId = req.params.id

    fs.readFile('rooms.json',(error,file)=>{
        if (error) {
            console.log("No se puede leer el archivo",error);
        }
        const rooms = JSON.parse(file);  

        return res.json(rooms.find((room) => room.id == roomId))
    })
})



// socket.io
let imageUrl, userRoom;

io.on("connection", (socket) => {
    socket.on("user-joined", (data) => {
        const { roomId, userId, userName } = data;
        userRoom = roomId;
        const user = userJoin(socket.id, userName, roomId);

        socket.join(user.room);

/*      //Agregar como colaborador del dibujo
        fs.readFile('rooms.json',(err,data)=>{
            if (err) {
                console.log("Error no se puede leer el archivo", err);
            }
            const rooms = JSON.parse(data);
            const room = rooms.find((room) => room.id == roomId) 

            io.to(user.room).emit("canvasElements", room.elements);

            if (!room.collaborators.includes(userId) && room.ownerId != userId){
                room.collaborators.push(userId)
            }

            const newRoom = JSON.stringify(rooms, null, 2);
            
            fs.writeFile('rooms.json',newRoom, (err)=>{
                if (err) {
                    console.log("Ha ocurrido un error al escribir en el archivo", err);
                }
            })
        }) */

        socket.emit("message", {
            message: "Bienvenido",
        });

        socket.broadcast.to(user.room).emit("message", {
            message: `${user.username} se ha unido.`,
        });
    });


    socket.on("drawing", ({roomId, elements}) => {
        socket.broadcast.to(roomId).emit("canvasElements", elements);
    });

    socket.on("save", ({roomId, img, elements}) => {
        //Actualizar elementos e imagen  de dibujo en bd
        fs.readFile('rooms.json',(err,data)=>{
            if (err) {
                console.log("Error no se puede leer el archivo", err);
            }

            const rooms = JSON.parse(data);
            
            const room = rooms.find((room) => room.id == roomId) 

            if (room != undefined){
                room.elements = elements
                room.img = img
            }

            const newRoom = JSON.stringify(rooms, null, 2);
            
            fs.writeFile('rooms.json',newRoom, (err)=>{
                if (err) {
                    console.log("Ha ocurrido un error al escribir en el archivo", err);
                }
            })
        })
    })

    socket.on("disconnect", () => {
        const userLeaves = userLeave(socket.id);

        if (userLeaves) {
            io.to(userLeaves.room).emit("message", {
                message: `${userLeaves.username} left the chat`,
            });
        }
    });
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`server is listening on http://localhost:${PORT}`)
);