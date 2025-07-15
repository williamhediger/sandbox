import { promises as fs } from 'fs';
import path from 'path';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

interface PolicyIndex {
  policies: { name: string; file: string }[];
}

export async function loadAndQuery(query: string): Promise<string> {
  try {
    // Check if index.json exists
    const indexPath = path.join(process.cwd(), 'public', 'policy_docs', 'index.json');
    let index: PolicyIndex;
    try {
      await fs.access(indexPath);
      const indexData = await fs.readFile(indexPath, 'utf-8');
      index = JSON.parse(indexData);
      if (!index.policies || !Array.isArray(index.policies)) {
        throw new Error('Invalid index.json format');
      }
    } catch (error) {
      throw new Error('index.json not found or invalid');
    }

    // Load policy documents
    const documents: Document[] = [];
    for (const policy of index.policies) {
      if (!policy.file || !policy.name) {
        console.warn(`Skipping invalid policy entry: ${JSON.stringify(policy)}`);
        continue;
      }
      const filePath = path.join(process.cwd(), 'public', 'policy_docs', policy.file);
      try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        documents.push(new Document({ pageContent: content, metadata: { name: policy.name } }));
      } catch (error) {
        console.warn(`Failed to load policy file: ${policy.file}`);
      }
    }

    if (documents.length === 0) {
      throw new Error('No valid policy documents found');
    }

    // Create vector store
    const vectorStore = await MemoryVectorStore.fromDocuments(documents, new OpenAIEmbeddings());
    const retriever = vectorStore.asRetriever();

    // Set up LLM
    const llm = new ChatOpenAI({ model: 'gpt-4', temperature: 0 });

    // Create chain
    const chain = RunnableSequence.from([
      {
        context: retriever.pipe((docs) => docs.map((doc) => doc.pageContent).join('\n')),
        question: new RunnablePassthrough(),
      },
      llm,
      new StringOutputParser(),
    ]);

    // Run query
    const answer = await chain.invoke(query);
    return answer;
  } catch (error) {
    console.error('LangChain Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to process query');
  }
}