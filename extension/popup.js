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
  
  resultsDiv.innerHTML = ''; 

  analyzeBtn.addEventListener('click', async () => {
    analyzeBtn.innerText = 'Analyzing...';
    analyzeBtn.disabled = true;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const scrapingResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: scrapeKagglePage, 
    });
    const scrapedData = scrapingResult[0].result;

    try {
      const response = await fetch('http://localhost:3000/api/generate-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scrapedData),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const projectIdeas = await response.json();
      displayProjectIdeas(projectIdeas);

    } catch (error) {
      console.error('Error fetching project ideas:', error);
      resultsDiv.innerHTML = `<p style="color: red;">Error: Could not get ideas. Is the local server running?</p>`;
    } finally {
        resultsDiv.classList.remove('hidden');
        analyzeBtn.style.display = 'none'; 
    }
  });

  function displayProjectIdeas(ideas) {
    resultsDiv.innerHTML = ''; 
    const title = document.createElement('h4');
    title.innerText = 'Project Ideas:';
    resultsDiv.appendChild(title);

    ideas.forEach(idea => {
      const ideaDiv = document.createElement('div');
      ideaDiv.className = 'idea'; 

      ideaDiv.innerHTML = `
        <h5>${idea.title}</h5>
        <p><strong>Problem Type:</strong> ${idea.problemType}</p>
        <p>${idea.description}</p>
      `;
      resultsDiv.appendChild(ideaDiv);
    });
  }
});