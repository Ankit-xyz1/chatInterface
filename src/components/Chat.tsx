import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageSquare, Shield, Ship, HelpCircle, Users, Settings, LogOut, Image, Menu, X } from 'lucide-react';


//interface for chat
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | any[];
}




const Chat: React.FC = () => {
  //message holder
  const [message, setMessage] = useState('');
  //currnet ongoing chat
  const [currentChat, setCurrentChat] = useState<ChatMessage[]>([]);
  const [currentChatToGpt, setcurrentChatToGpt] = useState<ChatMessage[]>([]);


  //sidebar 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  //this ref hook is used for an scroll effect 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  //
  const hasMounted = useRef(false);

  //dynamicaly on which claim user want to chat
  const [claimId1, setclaimId1] = useState<string>('af23b083-e55a-44d1-8aca-b0c051a31314')


  // Load chat history on component mount (beacuse we need chat history )
  useEffect(() => {

    //it fethces on every refresh from localstorage 
    const chat = JSON.parse(localStorage.getItem('chatWith_ai') ||
      JSON.stringify([{ role: "assistant", content: [{ type: "text", text: "hey how can i help you today" }] }])
    );

    const GptChat = JSON.parse(localStorage.getItem('currentChatToGpt') ||
      JSON.stringify([{ role: "assistant", content: [{ type: "text", text: "hey how can i help you today" }] }])
    );

    //and set it to currnet ongoing chat
    setCurrentChat(chat)
    setcurrentChatToGpt(GptChat)
    console.log(chat)
  }, []);




  useEffect(() => {
    //skipping the first render to avoid conflicts because just above we are fetching the chat from localstorage and trying to set it up 
    //and this is setting the chat into localstorage and since it dependency array have currnet chat it may set localstorage currnetchat to []
    //an empty array 
    if (!hasMounted.current) {
      hasMounted.current = true;
      return; //  Skip first render
    }

    localStorage.setItem("chatWith_ai", JSON.stringify(currentChat));
    localStorage.setItem("Gpt_chat", JSON.stringify(currentChat));
  }, [currentChat]);

  // Auto scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat]);



  //handling the sendmessage functions 
  //
  const handleSendMessage = async (e: React.FormEvent) => {
    //preventing the default behaviour
    e.preventDefault();
    if (message.trim()) {
      //creating a message format as openai supports 
      const newMessage: ChatMessage = { role: 'user', content: [{ type: 'text', text: message }] };
      //setting the message to nothing UX
      setMessage('');
      setcurrentChatToGpt([...currentChatToGpt, newMessage])
      //creating an update chat so user can see its chat going 
      const updatedChat = [...currentChatToGpt, newMessage];
      const updatedCurrentChat = [...currentChat, newMessage]
      //updating the state
      setCurrentChat(updatedCurrentChat);

      //AI
      try {
        //sending a req to our backend for LLM reply 
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/triage/chat`, {
          method: "POST",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "claim_id": claimId1,
            messagesArr: updatedChat //with the updated chat
          }),
        })
        //awaiting the data
        const data = await res.json()
        //if its sucess we add teh data to our chat
        if (data.success) {
          //creating a new message object to append
          const newAiMessage: ChatMessage = {
            role: 'assistant',
            content: [{ type: "text", text: data.message }]
          }
          //updating the state
          const aiRespondedChat = [...currentChatToGpt, newMessage, newAiMessage];
          const cChat = [...currentChat, newMessage, newAiMessage]
          setCurrentChat(cChat);
          setcurrentChatToGpt(aiRespondedChat)
        }
      } catch (error) {
        //handling the error
        console.log(error)
      }

    }
    setTimeout(() => {
      console.log("gptchat", currentChatToGpt);
      console.log("current caht", currentChat)
    }, 100);
  };


  //handiing the image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    //finding the file
    const files = e.target.files;
    const claimId = claimId1; // Replace this with actual ID (from props, state, etc.)

    //if no file return early
    if (!files || files.length === 0) return;

    //debugging
    //console.log("Image(s) selected:", [...files].map(f => f.name)); // debug log

    //creating an form data to send details
    const formData = new FormData();

    // looping and adding images
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]); // 'images' must match multer field
    }

    //appending the body to with cliam id
    formData.append("claimId", claimId);

    try {
      //uploading the evidences collecetd
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer/claim/uploadEvidence`, {
        method: "POST",
        credentials: 'include',
        body: formData,
      });

      //awaiting the data
      const data = await res.json();

      //if true we send the data to LLM
      if (res.ok) {
        //debugging
        // console.log(" Upload success:", data);
        //the updated chat
        let imageChat = []
        for (const imageUrl of data.urls) {
          const newMessage: ChatMessage = { role: 'user', content: [{ type: "text", text: "user uploaded a  evidence" }, { type: 'image_url', image_url: { url: imageUrl } }] };
          imageChat.push(newMessage);
        }
        const systemRes: ChatMessage = {
          role: 'system',
          content: [{ type: 'text', text: "user have uploaded an evidence here" }]
        }
        const imageResponseMessage: ChatMessage = {
          role: 'assistant',
          content: [{ type: 'text', text: "Thank you for uploading the evidence. If you have more evidence, feel free to upload it. Once you're done, click on the Submit Claim button." }]
        }
        setCurrentChat([...currentChat, ...imageChat, imageResponseMessage])
        setcurrentChatToGpt([...currentChatToGpt, systemRes, imageResponseMessage])

        try {

        } catch (error) {
          console.log(error)
        }

      } else {
        console.error("❌ Upload failed:", data);
      }


    } catch (err) {
      console.error("⚠️ Upload error:", err);
    }
    e.target.files = null
  };



  const handleSubmitClaim = async () => {
    console.log('Submitting claim...');
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/triage/evaluate`,{
      method:"POST",
      credentials:"include",
      body:JSON.stringify({claim_id: claimId1}),
      headers:{
        "Content-Type": "application/json"
      }
    })
    const data = await res.json()
    setCurrentChat([...currentChat, data.message])
    setcurrentChatToGpt([...currentChatToGpt, data.message])

  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 relative">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden absolute top-4 left-4 z-50 p-2 hover:bg-gray-800 rounded-lg"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:relative w-[280px] lg:w-[200px] bg-gray-900 border-r border-gray-800 
        flex flex-col h-full z-40 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Bottom menu */}
        <div className="border-t border-gray-800 p-2 space-y-1">
          <button className="flex items-center w-full p-2 text-sm rounded hover:bg-gray-800 transition-colors">
            <Users size={16} className="mr-2 text-gray-400" />
            <span>Clear conversations</span>
          </button>
          <button className="flex items-center w-full p-2 text-sm rounded hover:bg-gray-800 transition-colors">
            <Settings size={16} className="mr-2 text-gray-400" />
            <span>My account</span>
          </button>
          <button className="flex items-center w-full p-2 text-sm rounded hover:bg-gray-800 transition-colors">
            <HelpCircle size={16} className="mr-2 text-gray-400" />
            <span>Updates & FAQ</span>
          </button>
          <button className="flex items-center w-full p-2 text-sm rounded hover:bg-gray-800 transition-colors">
            <LogOut size={16} className="mr-2 text-gray-400" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-800 flex items-center justify-center">
          <h1 className="text-xl font-bold tracking-wider">PROT<span className="text-indigo-500">E</span>GA</h1>
        </div>



        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Feature selections */}
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 p-4">
            <div className="text-center hover:bg-gray-800 transition-colors p-4 rounded-lg w-full sm:w-36 cursor-pointer">
              <Ship className="mx-auto mb-2" />
              <p className="text-sm">Shipping Protection</p>
            </div>
            <div className="text-center hover:bg-gray-800 transition-colors p-4 rounded-lg w-full sm:w-36 cursor-pointer">
              <Shield className="mx-auto mb-2" />
              <p className="text-sm">Product Protection</p>
            </div>
            <div className="text-center hover:bg-gray-800 transition-colors p-4 rounded-lg w-full sm:w-36 cursor-pointer">
              <HelpCircle className="mx-auto mb-2" />
              <p className="text-sm">What's the difference?</p>
            </div>
          </div>
          {currentChat.map((msg, index) => (
            <div key={index} className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'} ${msg.role === 'system' && "hidden"}`}>
              <div className={`chat-bubble  ${msg.role === 'user' ? 'bg-cyan-400 text-gray-900' : 'bg-gray-700'}`}>
                {
                  msg && <>{msg.content.length > 1 ? <><img src={msg.content[1].image_url.url} className='rounded' height={200} width={200} alt="" /></> : msg.content[0].text}</>
                }

              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Submit claim button */}
        <div className="px-4 py-2 border-t border-gray-800">
          <button
            onClick={handleSubmitClaim}
            className="btn btn-success w-full"
          >
            Submit Claim
          </button>
        </div>

        {/* Message input */}
        <div className="border-t border-gray-800 p-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type message..."
              className="input flex-1 bg-gray-800 text-gray-100 outline-none"
            />
            <label htmlFor="image-upload" className="btn btn-circle btn-ghost cursor-pointer">
              <Image size={18} className="text-gray-400" />
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="submit"
              className="btn btn-circle btn-primary bg-cyan-400"
              disabled={!message.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;