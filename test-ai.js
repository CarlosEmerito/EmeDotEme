require('dotenv').config();
const { generateArticleContent } = require('./.next/server/app/api/generate/route'); // Won't work directly due to Next build.

// Let's use ts-node to run the raw service instead.
