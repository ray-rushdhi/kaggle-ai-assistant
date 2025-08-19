function scrapeKagglePage() {
  const title = document.querySelector('h1')?.innerText.trim();

  const descriptionContainer = document.querySelector('.sc-eTCgfj.iLRXUI');
  const description = descriptionContainer?.innerText.trim();

  let schema = '';

  const schemaTableRows = document.querySelectorAll('tbody > tr');
  if (schemaTableRows && schemaTableRows.length > 0) {
    const schemaData = [];
    schemaTableRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length === 2) {
        const columnName = cells[0].innerText.trim();
        const columnDescription = cells[1].innerText.trim();
        if (columnName.toLowerCase() !== 'column name') {
          schemaData.push(`- ${columnName}: ${columnDescription}`);
        }
      }
    });
    schema = schemaData.join('\n');
  }

  if (!schema) {
    const columnHeaderElements = document.querySelectorAll('div[role="columnheader"]');
    if (columnHeaderElements && columnHeaderElements.length > 0) {
      const columnNames = [];
      columnHeaderElements.forEach(header => {
        if (header.innerText) {
          columnNames.push(header.innerText.trim());
        }
      });
      schema = "Columns: " + columnNames.join(', ');
    }
  }

  return {
    title,
    description,
    schema
  };
}


document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultsDiv = document.getElementById('results');
  let cachedScrapedData = null; 

  analyzeBtn.addEventListener('click', async () => {
    analyzeBtn.innerText = 'Analyzing...';
    analyzeBtn.disabled = true;

    const scrapingResult = await chrome.scripting.executeScript({
      target: { tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id },
      function: scrapeKagglePage,
    });
    cachedScrapedData = scrapingResult[0].result; 

    try {
      const response = await fetch('http://localhost:3000/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cachedScrapedData),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const projectIdeas = await response.json();
      displayProjectIdeas(projectIdeas);
    } catch (error) {
      handleError(error, "Could not get project ideas.");
    } finally {
      analyzeBtn.style.display = 'none'; 
    }
  });

  function displayProjectIdeas(ideas) {
    resultsDiv.innerHTML = ''; 
    const title = document.createElement('h4');
    title.innerText = 'Choose a Project Idea:';
    resultsDiv.appendChild(title);

    ideas.forEach(idea => {
      const ideaCard = document.createElement('div');
      ideaCard.className = 'idea-card'; 
      ideaCard.innerHTML = `
        <h5>${idea.title}</h5>
        <p><strong>Problem Type:</strong> ${idea.problemType}</p>
      `;
      ideaCard.onclick = () => {
        getStepByStepGuide(idea);
      };
      resultsDiv.appendChild(ideaCard);
    });
    resultsDiv.classList.remove('hidden');
  }

  async function getStepByStepGuide(selectedIdea) {
    resultsDiv.innerHTML = '<h4>Generating your guide...</h4>'; 

    try {
      const response = await fetch('http://localhost:3000/api/generate-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetContext: cachedScrapedData,
          selectedIdea: selectedIdea,
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const { guide } = await response.json();
      displayGuide(guide);
    } catch (error) {
      handleError(error, "Could not generate the guide.");
    }
  }

  function displayGuide(guide) {
    resultsDiv.innerHTML = ''; 
    const guideContainer = document.createElement('div');
    guideContainer.className = 'guide-container';

    let guideHtml = guide
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
      .replace(/### (.*?)\n/g, '<h3>$1</h3>')   
      .replace(/## (.*?)\n/g, '<h2>$1</h2>')       
      .replace(/\* (.*?)\n/g, '<li>$1</li>')      
      .replace(/\n/g, '<br>');                    

    guideContainer.innerHTML = guideHtml;
    resultsDiv.appendChild(guideContainer);
  }

  function handleError(error, message) {
    console.error(message, error);
    resultsDiv.innerHTML = `<p style="color: red;">Error: ${message} Is the local server running?</p>`;
  }
});