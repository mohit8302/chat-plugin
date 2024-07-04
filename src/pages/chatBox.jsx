import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import sicon from "../assets/setting.svg";
import send from "../assets/send.svg";
import cross from "../assets/cross.svg";
import chat from "../assets/chat.svg";
import axios from "axios";
import cheerio from "cheerio";
import "./chatBox.css";

export const ChatBox = () => {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(5);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [firstTime, setFirstTime] = useState(true); // Use state to manage first time state

  const chatContainerRef = useRef(null);
  const location = useLocation();

  const handleNavigationTracking = () => {
    const now = new Date();
    let lastNavigationTime = parseInt(
      localStorage.getItem("lastNavigationTime")
    );
    let navigationCount = parseInt(localStorage.getItem("navigationCount"));

    if (!lastNavigationTime || isNaN(lastNavigationTime)) {
      lastNavigationTime = now.getTime();
      localStorage.setItem("lastNavigationTime", lastNavigationTime.toString());
    }

    if (!navigationCount || isNaN(navigationCount)) {
      navigationCount = 0;
      localStorage.setItem("navigationCount", navigationCount.toString());
    }

    const timeDiff = now - lastNavigationTime;
    if (timeDiff < 10000) {
      const newNavigationCount = navigationCount + 1;
      localStorage.setItem("navigationCount", newNavigationCount.toString());

      if (newNavigationCount >= 3) {
        console.log(`User navigated ${newNavigationCount} times in 10 seconds`);
        // Perform any additional actions here
        handleOpenChat();
        localStorage.setItem("navigationCount", "0");
        localStorage.setItem("lastNavigationTime", now.getTime().toString());
        setTimeout(() => {
          const clientResponse = {
            text: "You seem confused, need help?",
            timestamp: new Date(),
            sender: "client",
          };
          setMessages((prevMessages) => [...prevMessages, clientResponse]);
          setIsLoading(false);
          setFirstTime(false);
        }, 200); // Simulated delay for welcome message
      }
    } else {
      localStorage.setItem("lastNavigationTime", now.getTime().toString());
      localStorage.setItem("navigationCount", "0");
    }
  };

  useEffect(() => {
    handleNavigationTracking();
  }, []);

  // useEffect(() => {
  //   handleNavigationTracking();
  // }, [location.pathname]);

  const handleCloseChat = () => {
    setIsChatVisible(false);
  };

  const handleOpenChat = () => {
    setIsChatVisible(true);
    setNotificationCount(0);
    setFirstTime(false); // Update firstTime state to false when chat opens
  };

  const toggleSettings = () => {
    setIsSettingsVisible(!isSettingsVisible);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() !== "") {
      const newMessage = {
        text: inputValue,
        timestamp: new Date(),
        sender: "user",
      };
      setMessages([...messages, newMessage]);
      setInputValue("");
      setIsLoading(true);

      // Prepare the request payload
      const payload = {
        prompt: inputValue,
      };

      // Make the API call to the external server
      fetch(
        "https://aat7sty0nd.execute-api.eu-north-1.amazonaws.com/Prod/llm/prompt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          const assistantResponse = data.chat_answers_history[0];

          const testIDs = [
            "7476439646270",
            "",
            "7481635307582",
            "",
            "7476440006718",
            "1321313",
            "123132132",
          ]; // Add your IDs here

          // const testIDs = ['1231', '2234', '12387129732']
          // Randomly select an ID or use default
          const randomIndex = Math.floor(Math.random() * testIDs.length);
          const selectedID = testIDs[randomIndex];

          // Only add the productid tag if selectedID is not empty
          const idAddedResponse = selectedID
            ? `${assistantResponse} [productid: ${selectedID}]`
            : assistantResponse;

          const regex = /\[productid: (\d+)\]/;
          const match = idAddedResponse.match(regex);
          console.log("Match : ", match);
          let productId = match ? match[1] : null;

          console.log("productID: ", productId);

          //if there is product then fetch the product else dont show product or id
          if (productId) {
            handleProductRequest(productId)
              .then((resProd) => {
                const newMessage = idAddedResponse.replace(
                  regex,
                  `${resProd.text}`
                );
                const clientResponse = {
                  text: newMessage,
                  timestamp: new Date(),
                  sender: "client",
                };
                setMessages((prevMessages) => [
                  ...prevMessages,
                  clientResponse,
                ]);
              })
              .catch((error) => {
                //sends ai message without product
                console.error("Error handling product request:", error);
                const clientResponse = {
                  text: assistantResponse,
                  timestamp: new Date(),
                  sender: "client",
                };
                setMessages((prevMessages) => [
                  ...prevMessages,
                  clientResponse,
                ]);
              })
              .finally(() => {
                setIsLoading(false);
              });
          } else {
            //sends ai message without product
            console.log("wassiup");
            const clientResponse = {
              text: assistantResponse,
              timestamp: new Date(),
              sender: "client",
            };
            setMessages((prevMessages) => [...prevMessages, clientResponse]);
            setIsLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          setIsLoading(false);
        });
    }
  };

  const handleProductRequest = (id) => {
    return axios
      .get(`http://localhost:5000/api/products/${id}`)
      .then((response) => {
        const { title, handle, about } = response.data;
        const productUrl = `https://happyruh.com/products/${handle}`;

        return {
          text: `<p class="text-orange-700 underline"><a href=${productUrl} target="_blank">${title}</a></p> <br>`, //<span>${about}</span>
          url: productUrl,
          timestamp: new Date(),
          sender: "client",
          isHtml: true,
        };
      })
      .catch((error) => {
        console.error("Error fetching product:", error);
        throw error; // Propagate the error so it can be caught in the calling function
      });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      // if (inputValue.trim() === "give product") {
      //   handleProductRequest(7535331311678);
      // } else {
      handleSendMessage();
      // }
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // User staying on page for 5 seconds
  useEffect(() => {
    if (firstTime) {
      const timer = setTimeout(() => {
        // Code to run after 5 seconds
        console.log("Timer expired after 5 seconds");

        // Update state to open chat and send welcome message
        handleOpenChat();
        setTimeout(() => {
          const clientResponse = {
            text: "Hey! Welcome looking for anything specific?",
            timestamp: new Date(),
            sender: "client",
          };
          setMessages((prevMessages) => [...prevMessages, clientResponse]);
          setIsLoading(false);
          setFirstTime(false);
        }, 200); // Simulated delay for welcome message
      }, 5000); // 5000 milliseconds = 5 seconds

      // Clean up the timer if the component unmounts or timer is reset
      return () => clearTimeout(timer);
    }
  }, [firstTime]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <div className="chat-bot font-montserrat fixed bottom-4 right-4 sm:bottom-2 sm:right-2 md:bottom-6 md:right-6">
      {isChatVisible ? (
        <div className="relative">
          <div className="bg-[#EFEFEF] w-80 h-80 sm:w-72 sm:h-72 md:w-96 md:h-96 rounded-lg overflow-hidden shadow-lg flex flex-col bg-white">
            {/* Header */}
            <div className="bg-[#D9D9D9] flex items-center justify-between p-3 h-14">
              <div className="flex items-center">
                <div className="bg-[#7C7C7C] rounded-full w-6 h-6"></div>
                <span className="ml-4 text-gray-700">
                  {isSettingsVisible ? "AI Assistant Setting" : "AI Assistant"}
                </span>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={toggleSettings}
              >
                <img
                  className="setting-icon"
                  src={isSettingsVisible ? chat : sicon}
                  alt="icon"
                />
              </button>
            </div>

            {/* Main Content */}
            {isSettingsVisible ? (
              <div className="flex-1 bg-[#EFEFEF] p-4 overflow-y-auto">
                {/* Settings Panel */}
                <div className="font-semibold text-[#7C7C7C] flex flex-col space-y-4">
                  <div className="bg-[#D9D9D9] flex items-center justify-between p-2 rounded-lg">
                    <span>Suggest in real time</span>
                    <label className="switch">
                      <input type="checkbox" />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="bg-[#D9D9D9] flex items-center justify-between p-2 rounded-lg">
                    <span>Remember my choices</span>
                    <label className="switch">
                      <input type="checkbox" />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="bg-[#D9D9D9] flex items-center justify-between p-2 rounded-lg">
                    <span>Stop suggestions completely</span>
                    <label className="switch">
                      <input type="checkbox" />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="bg-[#D9D9D9] flex items-center justify-between p-2 rounded-lg">
                    <span>Remove assistant for me</span>
                    <label className="switch">
                      <input type="checkbox" />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="chat-text flex-1 bg-[#EFEFEF] p-4 overflow-y-auto chat-box"
                ref={chatContainerRef}
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message-container mb-2 flex flex-col ${
                      message.sender === "client" ? "items-start" : "items-end"
                    }`}
                  >
                    <div
                      className={`message-text p-2 rounded-md max-w-xs w-auto break-words ${
                        message.sender === "client"
                          ? "bg-[#FFFFFF]"
                          : "bg-[#D9D9D9]"
                      }`}
                    >
                      {/* using to render html of the product link */}
                      <p
                        className="text-gray-700 m-0"
                        dangerouslySetInnerHTML={{ __html: message.text }}
                      ></p>
                    </div>
                    <span className="message-timestamp text-[9px] text-gray-500 mt-1">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                ))}
                {isLoading && (
                  <div className="message-container mb-2 flex flex-col items-start">
                    <div className="loading-dots">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Area */}
            {!isSettingsVisible && (
              <div className="bg-[#EFEFEF] flex items-center p-2">
                <input
                  type="text"
                  placeholder="Talk to our assistant..."
                  className="flex-1 rounded-full py-2 px-4 text-gray-700 placeholder-gray-500 bg-[#FFFFFF] focus:outline-none"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  className="text-gray-500 hover:text-gray-700 ml-2"
                  onClick={handleSendMessage}
                >
                  <img className="w-6 h-6" src={send} alt="send-icon" />
                </button>
              </div>
            )}
          </div>
          <button
            className="cross-btn mt-8 sm:mt-8 md:ml-320 rounded-full w-12 h-12 bg-[#D9D9D9] text-gray-500 hover:text-gray-700 flex items-center justify-center"
            onClick={handleCloseChat}
          >
            <img className="w-6 h-6" src={cross} alt="close-icon" />
          </button>
        </div>
      ) : (
        <button
          className="relative rounded-full w-12 h-12 bg-[#D9D9D9] text-gray-500 hover:text-gray-700 flex items-center justify-center"
          onClick={handleOpenChat}
        >
          <img className="w-6 h-6" src={chat} alt="chat-icon" />
          {notificationCount > 0 && (
            <div className="notification-badge">{notificationCount}</div>
          )}
        </button>
      )}
    </div>
  );
};

export default ChatBox;
