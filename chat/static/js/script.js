let currentChatId = null;
let chatHistory = [];
let selectedImage = null;


// =========================
 // CREATE NEW CHAT
// =========================

async function createNewChat() {

    const logo =
    document.querySelector(".center-logo");

    if(logo){
        logo.style.display = "block";
    }

    const response = await fetch(
        "https://code-gpt-a3w3.onrender.com/new-chat",
        {
            method: "POST"
        }
    );

    const data = await response.json();

    currentChatId = data.chat_id;

      // clear old messages
    chatHistory = [];

    document.getElementById("chat-box").innerHTML = `
        <div class="message ai">
            👋 Hello! I am 🚀 Code-GPT.
        </div>
    `;

    // refresh sidebar
    await loadChats();
}


// =========================
// LOAD ALL CHATS
// =========================

async function loadChats() {

    const response = await fetch(
        "https://code-gpt-a3w3.onrender.com/chats"
    );

    const chats = await response.json();

    const chatList =
    document.getElementById("chat-list");

    chatList.innerHTML = "";

    chats.forEach(chat => {

        chatList.innerHTML += `
            <div
                class="chat-item"
                onclick="openChat('${chat._id}')">
                <span >
                ${chat.title}
                </span>

            <i
               class="fa-solid fa-trash delete-btn"
               onclick="event.stopPropagation(); deleteChat('${chat._id}')"
            ></i>
            </div>
        `;
    });
}


// =========================
// OPEN CHAT
// =========================

async function openChat(chatId) {

    currentChatId = chatId;

    const response = await fetch(
        `https://code-gpt-a3w3.onrender.com/chat/${chatId}`
    );

    const chat = await response.json();

    const chatBox =
    document.getElementById("chat-box");

    chatBox.innerHTML = "";

    chat.messages.forEach(msg => {

    let html = "";

    if (msg.attachment) {

        if (msg.attachment.type.startsWith("image")) {

            html += `
                <div class="attachment-message">
                    <img src="${msg.attachment.url}" class="chat-image">
                </div>
            `;

        } else {

            html += `
                <div class="attachment-message">
                    📄 ${msg.attachment.filename}
                </div>
            `;
        }
    }

    html += `
        <div class="message ${msg.role === "user" ? "user" : "ai"}">
            ${formatResponse(msg.content)}
        </div>
    `;

    chatBox.innerHTML += html;
});

    chatBox.scrollTop =
    chatBox.scrollHeight;


}

async function deleteChat(chatId){

    const response = await fetch(
        `https://code-gpt-a3w3.onrender.com/chat/${chatId}`,
        {
            method:"DELETE"
        }
    );

    if(response.ok){
        loadChats();
    }


    await loadChats();

    document.getElementById("chat-box").innerHTML =`
        <div class="message ai">
            👋 Hello! I am 🚀 Code-GPT.
        </div>
    `;
}

// =========================
// COPY CODE
// =========================

function copyCode(button){

    const code =
    button.parentElement
    .nextElementSibling
    .innerText;

    navigator.clipboard.writeText(code);

    button.innerText = "Copied";

    setTimeout(() => {
        button.innerText = "Copy";
    }, 1500);
}


// =========================
// FORMAT AI RESPONSE
// =========================
function formatResponse(text) {

    if (!text) return "";

    // Escape HTML
    text = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // =====================================
    // Code Blocks
    // =====================================

    text = text.replace(
        /```([a-zA-Z0-9+#.-]*)?\n([\s\S]*?)```/g,
        function (match, language, code) {

            language = language || "Code";

            return `
                <div class="code-container">

                    <div class="code-header">

                        <span>${language}</span>

                        <button
                            class="copy-btn"
                            onclick="copyCode(this)"
                        >
                            Copy
                        </button>

                    </div>

                    <pre><code>${code}</code></pre>

                </div>
            `;
        }
    );

    // =====================================
    // Headings
    // =====================================

    text = text.replace(/^###### (.*)$/gm, "<h6>$1</h6>");
    text = text.replace(/^##### (.*)$/gm, "<h5>$1</h5>");
    text = text.replace(/^#### (.*)$/gm, "<h4>$1</h4>");
    text = text.replace(/^### (.*)$/gm, "<h3>$1</h3>");
    text = text.replace(/^## (.*)$/gm, "<h2>$1</h2>");
    text = text.replace(/^# (.*)$/gm, "<h1>$1</h1>");

    // =====================================
    // Bold
    // =====================================

    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // =====================================
    // Italic
    // =====================================

    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // =====================================
    // Inline Code
    // =====================================

    text = text.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    // =====================================
    // Horizontal Rule
    // =====================================

    text = text.replace(
        /^---$/gm,
        "<hr>"
    );

    // =====================================
    // Block Quotes
    // =====================================

    text = text.replace(
        /^> (.*)$/gm,
        "<blockquote>$1</blockquote>"
    );

    // =====================================
    // Bullet Lists
    // =====================================

    text = text.replace(
        /^[-*] (.*)$/gm,
        "<li>$1</li>"
    );

    text = text.replace(
        /(<li>[\s\S]*?<\/li>)/g,
        "<ul>$1</ul>"
    );

    // =====================================
    // Number Lists
    // =====================================

    text = text.replace(
        /^\d+\.\s(.*)$/gm,
        "<li>$1</li>"
    );

    // =====================================
    // Links
    // =====================================

    text = text.replace(
        /(https?:\/\/[^\s]+)/g,
        `<a href="$1" target="_blank">$1</a>`
    );

    // =====================================
    // Line Breaks
    // =====================================

    text = text.replace(/\n/g, "<br>");

    return text;
}

function openSettings() {
    document.getElementById(
        "settings-modal"
    ).style.display = "flex";
}

function closeSettings() {
    document.getElementById(
        "settings-modal"
    ).style.display = "none";
}
function saveSettings(){

    localStorage.setItem(
        "theme",
        document.getElementById(
            "theme-select"
        ).value
    );

    localStorage.setItem(
        "fontSize",
        document.getElementById(
            "font-size-select"
        ).value
    );

    localStorage.setItem(
        "defaultModel",
        document.getElementById(
            "default-model-select"
        ).value
    );

    applySettings();

    document.getElementById(
        "settings-modal"
    ).style.display = "none";
}
function applySettings(){

    const theme =
        localStorage.getItem("theme")
        || "dark";

    const fontSize =
        localStorage.getItem("fontSize")
        || "16";

    const model =
        localStorage.getItem("defaultModel")
        || "qwen2.5-coder:7b";

    document.body.setAttribute(
        "data-theme",
        theme
    );

    document.documentElement.style
        .fontSize =
        fontSize + "px";

    document.getElementById(
        "model-select"
    ).value = model;
}
function toggleUploadMenu(event) {
    event.stopPropagation();

    document
        .getElementById("upload-menu")
        .classList
        .toggle("show");
}

document.addEventListener("click", function () {
    document
        .getElementById("upload-menu")
        .classList
        .remove("show");
});

document
    .getElementById("upload-menu")
    .addEventListener("click", function (e) {
        e.stopPropagation();
    });
async function uploadFile(file){

    if(!file) return;

     selectedImage = file;

    showAttachment({
        filename: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
    });

}


function showAttachment(file){

    const preview = document.getElementById("attachment-preview");

    let html = "";

    if(file.type.startsWith("image/")){

        html = `
        <div class="attachment-card">

            <img src="${file.url}" alt="preview">

            <span>${file.filename.split("/").pop()}</span>

            <button onclick="removeAttachment()">✕</button>

        </div>
        `;

    }else{

        html = `
        <div class="attachment-card">

            📄 ${file.filename.split("/").pop()}

            <button onclick="removeAttachment()">✕</button>

        </div>
        `;

    }

    preview.innerHTML = html;
}
function removeAttachment(){

    selectedImage=null;

    document.getElementById("attachment-preview").innerHTML="";

}
function toggleTheme() {

    document.body.classList.toggle("light-mode");

    if (document.body.classList.contains("light-mode")) {
        localStorage.setItem("theme", "light");
        document.getElementById("theme-select").value = "light";
    } else {
        localStorage.setItem("theme", "dark");
        document.getElementById("theme-select").value = "dark";
    }
}


// =========================
// SEND MESSAGE
// =========================

async function sendMessage(){

    console.log("1. sendMessage started");

       document.querySelector(".center-logo").style.display = "none";

    if (!currentChatId) {
    await createNewChat();
}
    console.log("2. Current Chat:", currentChatId);
   
    const messageInput =
    document.getElementById("message");

    const message =
    messageInput.value.trim();

    if (!message && !selectedImage) {
    return;
    }

    const chatBox =
    document.getElementById("chat-box");

    let userMessage = "";

if (selectedImage) {

    userMessage += `
        <div class="attachment-message">
            <img src="${URL.createObjectURL(selectedImage)}" class="chat-image">
        </div>
    `;

}

userMessage += `
    <div class="message user">
        ${message}
    </div>
`;

chatBox.innerHTML += userMessage;
    chatBox.scrollTop = chatBox.scrollHeight;

    messageInput.value = "";

    const loading =
    document.createElement("div");

    loading.className =
    "message ai";

    loading.innerHTML =
    "⏳ Thinking...";

    chatBox.appendChild(loading);

    chatBox.scrollTop = chatBox.scrollHeight;

    try{
   
        console.log("Selected Image:", selectedImage);
        console.log("3. About to call FastAPI");

    const formData = new FormData();

formData.append("chat_id", currentChatId);
formData.append("prompt", message);
formData.append(
    "model",
    document.getElementById("model-select").value
);

// Send selected image directly to FastAPI

if (selectedImage){
    formData.append("image",selectedImage);
}

console.log("Selected Image:", selectedImage);

if (selectedImage) {
    console.log("Image Name:", selectedImage.name);
    console.log("Image Type:", selectedImage.type);
    console.log("Image Size:", selectedImage.size);
} else {
    console.log("No image selected");
}

// Send request
const response = await fetch(
    "https://code-gpt-a3w3.onrender.com/chat",
    {
        method: "POST",
        body: formData
    }
);
    console.log("4. Response received:", response.status);    

        

        loading.remove();

        const streamId =
             "stream-" + Date.now();

        chatBox.innerHTML += `
        <div class="message ai">

            <div class="ai-header">
                <i class="fa-solid fa-robot"></i>
                <span>Code-GPT</span>
            </div>

            <div class="ai-text" id="${streamId}"></div>

    </div>
    `;

    const aiText =
    document.getElementById(streamId);

    console.log("AI TEXT ELEMENT:", aiText);

    const reader =
    response.body.getReader();

    const decoder =
    new TextDecoder();

    let fullText = "";

    while (true) {

       const { value,done } = 
       await reader.read();

    if (done) break;

    const chunk =
        decoder.decode(value);

    fullText += chunk;

    const html = formatResponse(fullText);

    console.log("HTML TO INSERT:");
    console.log(html);

    aiText.innerHTML = html;
    
    chatBox.scrollTop = chatBox.scrollHeight;    

    
}
    
        await loadChats();
        await openChat(currentChatId);
        selectedImage= null;
  
        document.getElementById("attachment-preview").innerHTML = "";

        }

    catch(error){

        loading.remove();

        chatBox.innerHTML += `
            <div class="message ai">
                ❌ Error connecting to AI backend.
            </div>
        `;

        console.log(error);
    }
}
function toggleChats() {

    document
        .getElementById("chat-list")
        .classList.toggle("show");

    document
        .getElementById("chat-arrow")
        .classList.toggle("rotate");
}

// =========================
// PAGE LOAD
// =========================

window.onload = async function(){

    await loadChats();

    const response = await fetch(
        "https://code-gpt-a3w3.onrender.com/chats"
    );

    const chats = await response.json();

    if(chats.length > 0){

        await openChat(chats[0]._id);

    }else{

        await createNewChat();
    }
};
document.addEventListener("DOMContentLoaded", () => {

    const sidebar =
    document.getElementById("sidebar");

    const toggleBtn =
    document.getElementById("sidebar-toggle");

    if(toggleBtn){

        toggleBtn.addEventListener("click", () => {

            sidebar.classList.toggle("collapsed");

        });

    }


});

function toggleChats(){

    const chatList =
    document.getElementById("chat-list");

    chatList.classList.toggle("hidden");
}
function getCookie(name) {

    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {

        const cookies = document.cookie.split(";");

        for (let cookie of cookies) {

            cookie = cookie.trim();

            if (cookie.startsWith(name + "=")) {

                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );

                break;
            }
        }
    }

    return cookieValue;
}