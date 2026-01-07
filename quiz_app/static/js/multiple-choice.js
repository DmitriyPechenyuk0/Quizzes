const answerCards = document.querySelectorAll('.answer-card-qz');
    let selectedAnswers = new Set();

    answerCards.forEach(card => {
        card.addEventListener('click', () => {
            const answerId = card.dataset.id;
            
            if (selectedAnswers.has(answerId)) {
                selectedAnswers.delete(answerId);
                card.classList.remove('selected-qz');
            } else {
                selectedAnswers.add(answerId);
                card.classList.add('selected-qz');
            }
        });
    });

    function getAnswersString() {
        const cards = document.querySelectorAll('.answer-card-qz');
        const results = [];
        
        cards.forEach(card => {
            const answerText = card.querySelector('.answer-text-qz').textContent;
            const isSelected = selectedAnswers.has(card.dataset.id);
            results.push(`${answerText}:${isSelected}`);
        });
        
        return results.join('|');
    }

    function setQuestion(questionData) {

        document.querySelector('.question-number-qz').textContent = `Вопрос ${questionData.number}`;
        document.querySelector('.question-text-qz').textContent = questionData.text;
        document.querySelector('.question-hint-qz').textContent = questionData.hint;

        const cards = document.querySelectorAll('.answer-card-qz');
        questionData.answers.forEach((answerText, index) => {
            if (cards[index]) {
                cards[index].querySelector('.answer-text-qz').textContent = answerText;
            }
        });

        resetSelections();
    }

    function resetSelections() {
        selectedAnswers.clear();
        
        answerCards.forEach(card => {
            card.classList.remove('selected-qz');
        });
    }