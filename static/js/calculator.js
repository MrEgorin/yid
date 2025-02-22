// Вибір елементів форми
const number1Input = document.getElementById('number1');
const number2Input = document.getElementById('number2');
const calculateButton = document.getElementById('calculate-btn');
const resultDiv = document.getElementById('result');

// Обробник події для кнопки "Calculate"
calculateButton.addEventListener('click', () => {
    // Отримання значень з полів вводу
    const num1 = parseFloat(number1Input.value);
    const num2 = parseFloat(number2Input.value);

    // Перевірка чи введені коректні числа
    if (isNaN(num1) || isNaN(num2)) {
        resultDiv.textContent = 'Please enter valid numbers.';
        resultDiv.style.color = 'red';
        return;
    }

    // Виконання операції додавання
    const sum = num1 + num2;

    // Виведення результату
    resultDiv.textContent = `Result: ${sum}`;
    resultDiv.style.color = '#28a745'; // Зелений колір для результату
});