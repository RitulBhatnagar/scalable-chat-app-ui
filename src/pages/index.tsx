import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {FormEvent, useEffect, useRef, useState} from "react"
import { set } from "react-hook-form";
import io,{Socket} from "socket.io-client"

const SOCKET_URL  = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://64.227.148.113"
const CONNECTION_COUNT_UPDATED_CHANNEL = "chat:connection-count-updated";
const NEW_MESSAGE_CHANNEL = "chat:new-message";
type Message = {
  message : string,
  id : string,
  createdAt : string,
  port : string
}
function useSocket(){
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
   const socketIo = io(SOCKET_URL, {
    reconnection : true,
    upgrade : true,
    transports : ["websocket", "polling"]  
   });
   setSocket(socketIo);

   return function(){
    socketIo.disconnect()
   }

  }, [])
  return socket;
}

export default function Home(){

  const socket = useSocket();
  const messageListref = useRef<HTMLOListElement | null>(null)
  const[newMessage, setNewMessage]  = useState('')
  const[messages, setMessages] = useState<Array<Message>>([])
  const[Connectioncount, setConnectionCount] = useState(0);
  function scrollTobottom(){
    if(messageListref.current){
      messageListref.current.scrollTop = messageListref.current.scrollHeight + 1000;

    }
  }
  useEffect(() => {
    
      socket?.on("connect", () => {
        console.log("connected To socket");
      })

      socket?.on(NEW_MESSAGE_CHANNEL, (message : Message) => {
        setMessages((prevMessages) => [message,...prevMessages])
        setTimeout(() => {
        scrollTobottom();
        }, 0)
      })

      socket?.on(CONNECTION_COUNT_UPDATED_CHANNEL, ({count} : {count : number}) => {
        setConnectionCount(count)
      })
  }, [socket])

  useEffect(() => {
    if(socket){
      socket.on("disconnect", () => {
        console.log("disconnected");
      })
    }
  }, [socket])


  function handleSubmit(e : FormEvent){
    e.preventDefault();
    socket?.emit(NEW_MESSAGE_CHANNEL, {
      message : newMessage,

    })
    setNewMessage('')
  }

  return(
    <main className="flex flex-col p-4 w-ull max-w-3xl w-auto">
      <h1 className="text-4xl font-bold text-center mb-4">CHAT {Connectioncount}</h1>
       <ol className=" flex-1 overflow-y-scroll overflow-x-hidden">
       {
        messages.map(e => {
          return( 
          <li className="bg-gray-100 rounded-lg p-4 my-2 break-all" key = {e.id}>{e.message}
          <p className="text-small text-gray-500">{e.createdAt}</p>
          
          </li>
          )
})
      }
       </ol>
      <form onSubmit={handleSubmit} className="flex items-center">
        <Textarea
        className="rounded-lg mr-4"
        placeholder="Type your message here"
        value = {newMessage}
        onChange={(e) => setNewMessage(e.target.value)} 
        maxLength={255}
        />
        <Button className="h-full">
          Send Message
        </Button>
      </form>
    </main>
  )
}