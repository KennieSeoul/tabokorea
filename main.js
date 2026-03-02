/* HTML 문서가 모두 로드되었을 때 실행될 함수를 등록합니다. */
document.addEventListener('DOMContentLoaded', () => {
    // HTML에서 id가 'generate-btn'인 요소를 찾아서 generateBtn 변수에 저장합니다.
    const generateBtn = document.getElementById('generate-btn');
    // HTML에서 id가 'lotto-numbers'인 요소를 찾아서 lottoNumbersContainer 변수에 저장합니다.
    const lottoNumbersContainer = document.getElementById('lotto-numbers');

    /**
     * 1부터 45까지의 숫자 중에서 중복되지 않는 6개의 숫자를 생성하는 함수입니다.
     * @returns {number[]} 정렬된 6개의 로또 번호 배열
     */
    function generateLottoNumbers() {
        // 중복된 값을 허용하지 않는 Set 객체를 생성합니다.
        const numbers = new Set();
        // Set에 6개의 숫자가 채워질 때까지 반복합니다.
        while (numbers.size < 6) {
            // 1부터 45까지의 랜덤 숫자를 생성합니다.
            const randomNumber = Math.floor(Math.random() * 45) + 1;
            // Set에 랜덤 숫자를 추가합니다. 중복된 숫자는 추가되지 않습니다.
            numbers.add(randomNumber);
        }
        // Set을 배열로 변환하고, 오름차순으로 정렬하여 반환합니다.
        return Array.from(numbers).sort((a, b) => a - b);
    }

    /**
     * 화면에 로또 번호를 표시하는 함수입니다.
     * @param {number[]} numbers - 표시할 로또 번호 배열
     */
    function displayNumbers(numbers) {
        // 이전에 표시된 번호들을 모두 지웁니다.
        lottoNumbersContainer.innerHTML = '';
        // 번호 배열을 순회하면서 각 번호를 화면에 표시합니다.
        numbers.forEach(number => {
            // div 요소를 생성합니다.
            const numberElement = document.createElement('div');
            // 생성된 div 요소에 'number' 클래스를 추가하여 스타일을 적용합니다.
            numberElement.className = 'number';
            // div 요소의 내용으로 번호를 설정합니다.
            numberElement.textContent = number;
            // 생성된 번호 요소를 로또 번호 컨테이너에 추가합니다.
            lottoNumbersContainer.appendChild(numberElement);
        });
    }

    // '번호 생성' 버튼에 클릭 이벤트 리스너를 추가합니다.
    generateBtn.addEventListener('click', () => {
        // 새로운 로또 번호를 생성합니다.
        const newNumbers = generateLottoNumbers();
        // 생성된 번호를 화면에 표시합니다.
        displayNumbers(newNumbers);
    });

    // 웹사이트가 처음 로드될 때 한 번 로또 번호를 생성하여 화면에 표시합니다.
    const initialNumbers = generateLottoNumbers();
    displayNumbers(initialNumbers);
});