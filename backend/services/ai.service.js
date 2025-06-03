// Import Google Generative AI SDK
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the AI model with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Configure the generative model and system instructions
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
      responseMimeType: "application/json",
  },
  systemInstruction: `You are an expert AI assistant specialized in software development. Format responses in DeepSeek style:
  1. Use clear markdown formatting with proper code blocks
  2. Always start with a brief introduction
  3. Use ### headings for sections
  4. Include code blocks with language specification
  5. Use bullet points for lists
  6. Provide explanations before code
  7. Add practical examples
  8. Mention edge cases and error handling
  9. Use **bold** for key terms
  10. Maintain professional yet approachable tone

  For file structures:
  - Use tree diagram format with proper indentation
  - Highlight important files with comments
  - Group related files together
  - Include both backend and frontend structure when applicable

  For code responses:
  - Use triple backticks with language tags
  - Include helpful comments
  - Add usage examples
  - Handle error cases
  - Follow best practices

  Note: Only include "Key features" if the user explicitly asks for them.

  Example DeepSeek-style responses:

  <example>
  User: Create an Express server
  Response: {
      "text": "### Basic Express Server Setup\\nHere's a minimal Express server configuration:\\n\\n\\\`\\\`\\\`javascript\\nconst express = require('express');\\nconst app = express();\\nconst PORT = 8080;\\n\\n// Basic route\\napp.get('/', (req, res) => {\\n    res.send('Hello World!');\\n});\\n\\n// Start server\\napp.listen(PORT, () => {\\n    console.log(\\\`Server running on port \\\${PORT}\\\`);\\n});\\n\\\`\\\`\\\`\\n\\n**File structure:**\\n\\\`\\\`\\\`\\nproject/\\n├── server.js\\n├── package.json\\n└── node_modules/\\n\\\`\\\`\\\`\\n\\n**To get started:**\\n1. Run \\\`npm init -y\\\`\\n2. Install Express: \\\`npm install express\\\`\\n3. Start server: \\\`node server.js\\\`"
  }
  </example>

  <example>
  User: Create a React component
  Response: {
      "text": "### Functional React Component\\nHere's a reusable button component with PropTypes:\\n\\n\\\`\\\`\\\`jsx\\nimport PropTypes from 'prop-types';\\n\\nconst Button = ({ label, onClick, variant = 'primary' }) => (\\n    <button \\n        className={\\\`btn btn-\\\${variant}\\\`}\\n        onClick={onClick}\\n    >\\n        {label}\\n    </button>\\n);\\n\\nButton.propTypes = {\\n    label: PropTypes.string.isRequired,\\n    onClick: PropTypes.func,\\n    variant: PropTypes.oneOf(['primary', 'secondary', 'danger'])\\n};\\n\\nexport default Button;\\n\\\`\\\`\\\`"
  }
  </example>

  Maintain these response characteristics:
  - Clear section separation
  - Practical code examples
  - File structure visualization
  - Relevant annotations
  - Modern ES6+ syntax
  - Error handling examples
  - Security considerations
  - Performance optimizations
  - Scalability notes`
});

// Generate a result from the AI model based on the prompt
export const generateResult = async (prompt) => {
    // Preprocess the prompt to detect if "Key features" are requested
    const includeKeyFeatures = /key features/i.test(prompt);

    const result = await model.generateContent(prompt);

    // Replace the placeholder BACKTICK with actual backticks
    let responseText = result.response.text().replace(/BACKTICK/g, "```");

    // Preprocess file and folder names to remove backticks and wrap them in bold markdown
    responseText = responseText.replace(/`([\w\-./]+)`/g, '**$1**');

    // Remove "Key features" section if not requested
    if (!includeKeyFeatures) {
        responseText = responseText.replace(/### Key features[\s\S]*?(?=\n###|$)/, '');
    }

    return responseText;
};





















// import "dotenv/config";               
// import { InferenceClient } from "@huggingface/inference";

// // Hugging Face Inference client initialize
// const HF_API_TOKEN = process.env.HF_API_TOKEN;

// const client = new InferenceClient(HF_API_TOKEN);
// const MODEL_ID = "deepseek-ai/DeepSeek-R1";  
// const PROVIDER = "together";

// /**
//  * Chat completion using Hugging Face InferenceClient
//  */
// export async function generateResult(prompt) {
//   try {
//     const messages = fullPrompt(prompt);
//     const response = await client.chatCompletion({
//       model: MODEL_ID,
//       provider: PROVIDER,
//       messages: messages,
//       parameters: {
//         max_new_tokens: 512,
//         temperature: 0.2
//       }
//     });

//     // Response parse karo
//     const text = response.choices?.[0]?.message?.content || "";
//     return postProcess(text);

//   } catch (err) {
//     console.error("❌ HF Inference Error:", err.message || err);
//     throw err;
//   }
// }

// /**
//  * deepseek-style system instruction + user prompt baniye
//  */
// function fullPrompt(userPrompt) {
//   const systemInstruction = `You are an expert AI assistant specialized in software development. Format responses in DeepSeek style:
//   1. Use clear markdown formatting with proper code blocks
//   2. Always start with a brief introduction
//   3. Use ### headings for sections
//   4. Include code blocks with language specification
//   5. Use bullet points for lists
//   6. Provide explanations before code
//   7. Add practical examples
//   8. Mention edge cases and error handling
//   9. Use **bold** for key terms
//   10. Maintain professional yet approachable tone

//   For file structures:
//   - Use tree diagram format with proper indentation
//   - Highlight important files with comments
//   - Group related files together
//   - Include both backend and frontend structure when applicable

//   For code responses:
//   - Use triple backticks with language tags
//   - Include helpful comments
//   - Add usage examples
//   - Handle error cases
//   - Follow best practices

//   Note: Only include "Key features" if the user explicitly asks for them.

//   Example DeepSeek-style responses:

//   <example>
//   User: Create an Express server
//   Response: {
//       "text": "### Basic Express Server Setup\\nHere's a minimal Express server configuration:\\n\\n\\\`\\\`\\\`javascript\\nconst express = require('express');\\nconst app = express();\\nconst PORT = 8080;\\n\\n// Basic route\\napp.get('/', (req, res) => {\\n    res.send('Hello World!');\\n});\\n\\n// Start server\\napp.listen(PORT, () => {\\n    console.log(\\\`Server running on port \\\${PORT}\\\`);\\n});\\n\\\`\\\`\\\`\\n\\n**File structure:**\\n\\\`\\\`\\\`\\nproject/\\n├── server.js\\n├── package.json\\n└── node_modules/\\n\\\`\\\`\\\`\\n\\n**To get started:**\\n1. Run \\\`npm init -y\\\`\\n2. Install Express: \\\`npm install express\\\`\\n3. Start server: \\\`node server.js\\\`"
//   }
//   </example>

//   <example>
//   User: Create a React component
//   Response: {
//       "text": "### Functional React Component\\nHere's a reusable button component with PropTypes:\\n\\n\\\`\\\`\\\`jsx\\nimport PropTypes from 'prop-types';\\n\\nconst Button = ({ label, onClick, variant = 'primary' }) => (\\n    <button \\n        className={\\\`btn btn-\\\${variant}\\\`}\\n        onClick={onClick}\\n    >\\n        {label}\\n    </button>\\n);\\n\\nButton.propTypes = {\\n    label: PropTypes.string.isRequired,\\n    onClick: PropTypes.func,\\n    variant: PropTypes.oneOf(['primary', 'secondary', 'danger'])\\n};\\n\\nexport default Button;\\n\\\`\\\`\\\`"
//   }
//   </example>

//   Maintain these response characteristics:
//   - Clear section separation
//   - Practical code examples
//   - File structure visualization
//   - Relevant annotations
//   - Modern ES6+ syntax
//   - Error handling examples
//   - Security considerations
//   - Performance optimizations
//   - Scalability notes`

//   return [
//     { role: "system",  content: systemInstruction },
//     { role: "user",    content: userPrompt }
//   ];
// }

// /**
//  * Post-processing: replace placeholders aur formatting
//  */
// function postProcess(text) {
//   let out = text.replace(/BACKTICK/g, "```");
//   out = out.replace(/`([\w\-./]+)`/g, "**$1**");
//   if (!/key features/i.test(text)) {
//     out = out.replace(/### Key features[\s\S]*?(?=\n###|$)/, "");
//   }
//   return out.trim();
// }