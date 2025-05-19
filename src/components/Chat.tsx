import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageSquare, Shield, Ship, HelpCircle, Users, Settings, LogOut, Image, Menu, X, IdCard, Loader, CheckCheck } from 'lucide-react';


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
  const [allClaims, setallClaims] = useState<string[]>(['0333962c-d639-4f10-8e78-79d793296c59', '3c33616a-13d0-4125-b1fb-a3f09e95e20e', '3d9d7f4c-a8bb-4fe0-8a0c-cee726649aeb', 'af23b083-e55a-44d1-8aca-b0c051a31314'])
  const [ChatLoading, setChatLoading] = useState<boolean>(false)
  const [showSubmitClaim, setshowSubmitClaim] = useState<boolean>(false)

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
    const chat = JSON.parse(localStorage.getItem(claimId1) ||
      JSON.stringify([{ role: "assistant", content: [{ type: "text", text: "hey how can i help you today" }] }])
    );

    const GptChat = JSON.parse(localStorage.getItem(claimId1 + "GPT") ||
      JSON.stringify([{ role: "assistant", content: [{ type: "text", text: "hey how can i help you today" }] }])
    );

    //and set it to currnet ongoing chat
    setCurrentChat(chat)
    setcurrentChatToGpt(GptChat)
    console.log(chat)
  }, []);


  useEffect(() => {
    if (currentChat.length > 2) {
      setshowSubmitClaim(true)
    } else {
      setshowSubmitClaim(false)
    }
  }, [currentChat])


  useEffect(() => {
    const chat = JSON.parse(localStorage.getItem(claimId1) ||
      JSON.stringify([{ role: "assistant", content: [{ type: "text", text: "hey how can i help you today" }] }])
    );

    const GptChat = JSON.parse(localStorage.getItem(claimId1 + "GPT") ||
      JSON.stringify([{ role: "assistant", content: [{ type: "text", text: "hey how can i help you today" }] }])
    );

    //and set it to currnet ongoing chat
    setCurrentChat(chat)
    setcurrentChatToGpt(GptChat)
  }, [claimId1])


  useEffect(() => {
    //skipping the first render to avoid conflicts because just above we are fetching the chat from localstorage and trying to set it up 
    //and this is setting the chat into localstorage and since it dependency array have currnet chat it may set localstorage currnetchat to []
    //an empty array 
    if (!hasMounted.current) {
      hasMounted.current = true;
      return; //  Skip first render
    }

    localStorage.setItem(claimId1, JSON.stringify(currentChat));
    localStorage.setItem(claimId1 + "GPT", JSON.stringify(currentChat));
  }, [currentChat]);

  // Auto scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat]);





  //handling the sendmessage functions 
  //
  const handleSendMessage = async (e: React.FormEvent) => {
    setChatLoading(true)
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
        setChatLoading(false)
      } catch (error) {
        //handling the error
        console.log(error)
        setChatLoading(false)
      }

    }
    setChatLoading(false)
  };


  //handiing the image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatLoading(true)
    //finding the file
    const files = e.target.files;
    const claimId = claimId1; // Replace this with actual ID (from props, state, etc.)

    //if no file return early
    if (!files || files.length === 0) {
      setChatLoading(false)
      return
    };

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
      setChatLoading(false)

    } catch (err) {
      setChatLoading(false)
      console.error("⚠️ Upload error:", err);
    }
    setChatLoading(false)
    e.target.files = null
  };



  const handleSubmitClaim = async () => {
    setChatLoading(true)
    try {
      console.log('Submitting claim...');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/triage/evaluate`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ claim_id: claimId1 }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      const data = await res.json()
      setCurrentChat([...currentChat, data.message])
      setcurrentChatToGpt([...currentChatToGpt, data.message])
    } catch (error) {
      setChatLoading(false)
    }
    setChatLoading(false)
  };

  return (
    <div className="flex h-screen bg-[#1c1c1c] text-gray-100 relative">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden absolute top-4 left-4 z-50 p-2 hover:bg-gray-800 rounded-lg"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:relative w-[280px] lg:w-[200px] bg-[1c1c1c] border-r border-gray-800 
        flex flex-col h-full z-40 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Bottom menu */}
        <div className=' mt-16'>
          {allClaims.map((item) => (
            <div className="border-t border-gray-800 p-2 space-y-1">
              <button className=" cursor-pointer flex items-center w-full p-2 text-sm rounded hover:bg-gray-800 transition-colors" onClick={() => setclaimId1(item)}>
                <IdCard size={16} className="mr-2 text-gray-400" />
                <span>claim {item.substring(0, 5)}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-800 flex items-center justify-center">
          <img src="./logo.png" alt="" />
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
              <div className="chat-image avatar">
                <div className="w-10 rounded-full">
                  {
                    msg.role === 'user' ? <>
                      <div className='h-full w-full flex items-center justify-center'> U </div>
                    </> : <>
                      <img
                        alt="Tailwind CSS chat bubble component"
                        src="/anaya.jpg"
                      />
                    </>
                  }

                </div>
              </div>
              {
                msg.role === 'user' ? <>
                  <div className="chat-header mr-3">
                    user
                  </div>
                </> : <>
                  <div className="chat-header ml-2">
                    Anaya
                  </div>
                </>
              }

              <div className={`chat-bubble  p-2 rounded-2xl  ${msg.role === 'user' ? 'bg-[#373737] text-white' : 'bg-[#373737]'}`}>
                {
                  msg && <>{msg.content.length > 1 ? <><img src={msg.content[1].image_url.url} className='rounded' height={200} width={200} alt="" /></> : msg.content[0].text}</>
                }
              </div>
              <div className="chat-footer opacity-50"><CheckCheck size={15} /></div>
            </div>
          ))}
          {ChatLoading &&
            <div className={`chat chat-start`}>
              <div className={`chat-bubble  bg-cyan-400 text-gray-900 `}>
                <Loader className='animate-spin' size={15} />
              </div>
            </div>
          }
          <div ref={messagesEndRef} />
        </div>
        {showSubmitClaim && <>
          <div className="px-4 py-2 border-t border-gray-800">
            <button
              onClick={handleSubmitClaim}
              className="btn btn-success w-full"
            >
              Submit Claim
            </button>
          </div></>}
        {/* Submit claim button */}


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