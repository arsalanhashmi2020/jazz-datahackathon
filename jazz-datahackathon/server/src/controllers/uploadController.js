import fs from "fs"; // Existing import for callback-based usage
import { readFile } from "fs/promises"; // Import readFile from fs/promises for promise-based usage
import {dot, norm} from "mathjs";
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyDTioxAFGPuzWOX3pvhigkA44ugU9_IiT0");

import Document from '../models/Document.js'; // Import the model


async function generate_embedding(raw_text, fileName = '', filePath = '') {
    try {
        console.log('Generating embedding for:', raw_text); // Output the content to the console
        const model = genAI.getGenerativeModel({ model: "embedding-001"});
        console.log("Model acquired, generating embedding");

        const result = await model.embedContent(raw_text);
        const embedding = result.embedding.values;
        console.log("Embedding generated:", embedding);

        if (fileName && filePath) {
            // Create a new document in the database only if filename and filepath are provided
            const newDocument = new Document({
                name: fileName,
                path: filePath,
                embedding: embedding
            });
            await newDocument.save();
            console.log('Document saved successfully!');
        }
        return embedding; // Return the embedding
    } catch (err) {
        console.error('Error in generate_embedding:', err);
        throw err; // Rethrow the error to handle it in the calling function
    }
}



const uploadFile = (req, res) => {
    console.log(`Original File Name: ${req.file.originalname}`);

    fs.readFile(req.file.path, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return res.status(500).send('Error reading the file');
        }

        // Call generate_embedding with additional parameters
        generate_embedding(data, req.file.originalname, req.file.path)
            .then(() => res.send('File uploaded and content read successfully'))
            .catch(err => res.status(500).send('Error processing file'));
    });
};

async function generate_search_embedding(query) {
    try {
        console.log('Generating embedding for search query:', query); // Output the content to the console
        const model = genAI.getGenerativeModel({ model: "embedding-001"});
        console.log("Model acquired, generating embedding");

        const result = await model.embedContent(query);
        const embedding = result.embedding.values;
        console.log("Search embedding generated:", embedding);

        return embedding; // Return the embedding directly
    } catch (err) {
        console.error('Error in generate_search_embedding:', err);
        throw err; // Rethrow the error to handle it in the calling function
    }
}

// Function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
    const dotProduct = dot(vecA, vecB);
    const normA = norm(vecA);
    const normB = norm(vecB);
    return dotProduct / (normA * normB);
}

// Function to find k nearest neighbors
async function findNearestDocuments(searchEmbedding, k) {
    try {
        // Retrieve only the embeddings, ids, and names
        const documents = await Document.find({}, 'embedding _id name').exec();  // Ensure 'name' is also retrieved

        // Calculate similarity with each document's embedding
        const similarities = documents.map(doc => ({
            id: doc._id,
            name: doc.name,  // Make sure 'name' is part of your document schema
            similarity: cosineSimilarity(searchEmbedding, doc.embedding)
        }));

        // Sort by highest similarity in descending order and select top k
        const sortedBySimilarity = similarities.sort((a, b) => b.similarity - a.similarity);
        const nearestNeighbors = sortedBySimilarity.slice(0, k);

        console.log(nearestNeighbors);  // Logging the sorted list to see the result
        return nearestNeighbors;
    } catch (err) {
        console.error('Error finding nearest documents:', err);
        throw err;
    }
}

async function searchFiles(req, res) {
    const query = req.query.query;  // This assumes the query parameter is named 'query'
    try {
        const searchEmbedding = await generate_search_embedding(query);
        const nearestNeighbors = await findNearestDocuments(searchEmbedding, 5);  // Example: Find top 5 nearest neighbors

        // Retrieve document details based on nearest neighbor IDs
        const documents = await Document.find({
            '_id': { $in: nearestNeighbors.map(nn => nn.id) }
        }).exec();

        // Reorder documents to match the order of nearestNeighbors
        const orderedDocuments = nearestNeighbors.map(nn => 
            documents.find(doc => doc._id.toString() === nn.id.toString())
        );

        // Read file contents for each document and prepare response
        const results = await Promise.all(orderedDocuments.map(async doc => {
            try {
                const content = await readFile(doc.path, 'utf8'); // Using fs/promises readFile
                return { filename: doc.name, content: content };
            } catch (err) {
                console.error(`Failed to read file: ${doc.path}`, err);
                return { filename: doc.name, content: "Failed to load content" };
            }
        }));

        res.json({ message: "Search completed", results: results });
    } catch (error) {
        console.error('Error processing search:', error);
        res.status(500).send('Error in search processing');
    }
}



export { uploadFile, searchFiles };

