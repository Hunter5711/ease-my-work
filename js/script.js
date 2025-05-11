
        var gk_isXlsx = false;
        var gk_xlsxFileLookup = {};
        var gk_fileData = {};
        function filledCell(cell) {
          return cell !== '' && cell != null;
        }
        function loadFileData(filename) {
        if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
            try {
                var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
                var firstSheetName = workbook.SheetNames[0];
                var worksheet = workbook.Sheets[firstSheetName];

                // Convert sheet to JSON to filter blank rows
                var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
                // Filter out blank rows (rows where all cells are empty, null, or undefined)
                var filteredData = jsonData.filter(row => row.some(filledCell));

                // Heuristic to find the header row by ignoring rows with fewer filled cells than the next row
                var headerRowIndex = filteredData.findIndex((row, index) =>
                  row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
                );
                // Fallback
                if (headerRowIndex === -1 || headerRowIndex > 25) {
                  headerRowIndex = 0;
                }

                // Convert filtered JSON back to CSV
                var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex)); // Create a new sheet from filtered array of arrays
                csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
                return csv;
            } catch (e) {
                console.error(e);
                return "";
            }
        }
        return gk_fileData[filename] || "";
        }
        

        const selections = {};
        let changeLogs = [];
        const defaultLabels = {
            1: { heading: 'Page 1', optionA: 'Option A', optionB: 'Option B', optionC: 'Option C' },
            2: { heading: 'Page 2', optionA: 'Option A', optionB: 'Option B', optionC: 'Option C' },
            3: { heading: 'Page 3', optionA: 'Option A', optionB: 'Option B', optionC: 'Option C' },
            4: { heading: 'Page 4', optionA: 'Option A', optionB: 'Option B', optionC: 'Option C' },
            5: { heading: 'Page 5', optionA: 'Option A', optionB: 'Option B', optionC: 'Option C' }
        };
        let labels = JSON.parse(localStorage.getItem('pageLabels')) || defaultLabels;

        // Apply saved labels on load
        function applyLabels() {
            for (let i = 1; i <= 5; i++) {
                document.getElementById(`heading${i}`).textContent = labels[i].heading;
                document.getElementById(`optionA${i}`).textContent = labels[i].optionA;
                document.getElementById(`optionB${i}`).textContent = labels[i].optionB;
                document.getElementById(`optionC${i}`).textContent = labels[i].optionC;
                document.getElementById(`optionA${i}`).setAttribute('data-value', labels[i].optionA);
                document.getElementById(`optionB${i}`).setAttribute('data-value', labels[i].optionB);
                document.getElementById(`optionC${i}`).setAttribute('data-value', labels[i].optionC);
            }
        }
        applyLabels();

        function goToAdmin() {
            document.querySelector('.page.active').classList.remove('active');
            document.getElementById('adminPage').classList.add('active');
            loadPageLabels();
        }

        function loadPageLabels() {
            const pageNum = document.getElementById('editPageSelect').value;
            document.getElementById('pageHeading').value = labels[pageNum].heading;
            document.getElementById('optionA').value = labels[pageNum].optionA;
            document.getElementById('optionB').value = labels[pageNum].optionB;
            document.getElementById('optionC').value = labels[pageNum].optionC;
        }

        function savePageLabels() {
            const pageNum = document.getElementById('editPageSelect').value;
            const heading = document.getElementById('pageHeading').value.trim() || `Page ${pageNum}`;
            const optionA = document.getElementById('optionA').value.trim() || 'Option A';
            const optionB = document.getElementById('optionB').value.trim() || 'Option B';
            const optionC = document.getElementById('optionC').value.trim() || 'Option C';

            // Log the change
            const timestamp = new Date().toISOString();
            changeLogs.push(`${timestamp}, Page ${pageNum}, Heading: ${heading}, OptionA: ${optionA}, OptionB: ${optionB}, OptionC: ${optionC}`);

            // Update selections to reflect new labels
            if (selections[`page${pageNum}`]) {
                const oldLabels = labels[pageNum];
                const newLabels = { optionA, optionB, optionC };
                selections[`page${pageNum}`] = selections[`page${pageNum}`].map(value => {
                    if (value === oldLabels.optionA) return newLabels.optionA;
                    if (value === oldLabels.optionB) return newLabels.optionB;
                    if (value === oldLabels.optionC) return newLabels.optionC;
                    return value;
                });
            }

            labels[pageNum] = { heading, optionA, optionB, optionC };
            localStorage.setItem('pageLabels', JSON.stringify(labels));
            applyLabels();
            updateButtonStyles(pageNum);
            alert('Labels saved!');
        }

        function downloadLogs() {
            const logContent = changeLogs.join('\n');
            const blob = new Blob([logContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'label_change_logs.txt';
            a.click();
            URL.revokeObjectURL(url);
        }

        function toggleOption(pageNum, value) {
            if (!selections[`page${pageNum}`]) {
                selections[`page${pageNum}`] = [];
            }
            const index = selections[`page${pageNum}`].indexOf(value);
            if (index === -1) {
                selections[`page${pageNum}`].push(value);
            } else {
                selections[`page${pageNum}`].splice(index, 1);
            }
            updateButtonStyles(pageNum);
        }

        function updateButtonStyles(pageNum) {
            const buttons = document.querySelectorAll(`.option-button[data-page="${pageNum}"]`);
            buttons.forEach(button => {
                const value = button.getAttribute('data-value');
                if (selections[`page${pageNum}`]?.includes(value)) {
                    button.classList.add('selected');
                } else {
                    button.classList.remove('selected');
                }
            });
        }

        function nextPage(currentPage) {
            document.getElementById(`page${currentPage}`).classList.remove('active');
            if (currentPage < 5) {
                document.getElementById(`page${currentPage + 1}`).classList.add('active');
                updateButtonStyles(currentPage + 1);
            } else {
                document.getElementById('summaryPage').classList.add('active');
                displaySummary();
            }
        }

        function goToPage(pageNum) {
            document.querySelector('.page.active').classList.remove('active');
            document.getElementById(`page${pageNum}`).classList.add('active');
            updateButtonStyles(pageNum);
        }

        function resetAll() {
            Object.keys(selections).forEach(key => delete selections[key]);
            for (let i = 1; i <= 5; i++) {
                updateButtonStyles(i);
            }
            document.querySelector('.page.active').classList.remove('active');
            document.getElementById('page1').classList.add('active');
        }

        function displaySummary() {
            const summary = Object.keys(selections)
                .sort()
                .map(page => {
                    const opts = selections[page].length > 0 
                        ? selections[page].join(', ') 
                        : 'no options';
                    return `On ${labels[page.replace('page', '')].heading}, you selected ${opts}.`;
                })
                .join(' ');
            document.getElementById('summary').textContent = summary || 'No selections made.';
        }

        function copySummary() {
            const summaryText = document.getElementById('summary').textContent;
            const textarea = document.createElement('textarea');
            textarea.value = summaryText;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try {
                document.execCommand('copy');
                alert('Summary copied to clipboard!');
            } catch (err) {
                alert('Failed to copy summary. Please copy the text manually.');
            }
            document.body.removeChild(textarea);
        }

        // Initialize admin page select
        loadPageLabels();
    