/* HTML 문서가 모두 로드되었을 때 실행될 함수를 등록합니다. */
document.addEventListener('DOMContentLoaded', () => {
    // HTML에서 필요한 요소들을 찾아서 변수에 저장합니다.
    const generateBtn = document.getElementById('generate-btn');
    const lottoNumbersContainer = document.getElementById('lotto-numbers');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    /**
     * 테마를 설정하고 로컬 스토리지에 저장하는 함수입니다.
     */
    function setTheme(isDark) {
        if (isDark) {
            body.classList.add('dark-mode');
            themeToggleBtn.textContent = '라이트 모드';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            themeToggleBtn.textContent = '다크 모드';
            localStorage.setItem('theme', 'light');
        }
    }

    // 초기 테마 설정 (로컬 스토리지 확인)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        setTheme(true);
    }

    // 테마 토글 버튼 클릭 이벤트
    themeToggleBtn.addEventListener('click', () => {
        const isDark = body.classList.contains('dark-mode');
        setTheme(!isDark);
    });

    /**
     * 1부터 45까지의 숫자 중에서 중복되지 않는 6개의 숫자를 생성하는 함수입니다.
     * @returns {number[]} 정렬된 6개의 로또 번호 배열
     */
    function generateLottoNumbers() {
        const numbers = new Set();
        while (numbers.size < 6) {
            const randomNumber = Math.floor(Math.random() * 45) + 1;
            numbers.add(randomNumber);
        }
        return Array.from(numbers).sort((a, b) => a - b);
    }

    /**
     * 숫자에 따른 색상 클래스를 반환하는 함수입니다.
     * @param {number} number - 로또 번호
     * @returns {string} CSS 클래스 명
     */
    function getNumberClass(number) {
        if (number <= 10) return 'number-yellow';
        if (number <= 20) return 'number-blue';
        if (number <= 30) return 'number-red';
        if (number <= 40) return 'number-gray';
        return 'number-green';
    }

    /**
     * 화면에 로또 번호를 표시하는 함수입니다.
     * @param {number[]} numbers - 표시할 로또 번호 배열
     */
    function displayNumbers(numbers) {
        lottoNumbersContainer.innerHTML = '';
        numbers.forEach(number => {
            const numberElement = document.createElement('div');
            // 'number' 기본 클래스와 숫자에 따른 색상 클래스를 함께 추가합니다.
            numberElement.className = `number ${getNumberClass(number)}`;
            numberElement.textContent = number;
            lottoNumbersContainer.appendChild(numberElement);
        });
    }

    // '번호 생성' 버튼 클릭 이벤트
    generateBtn.addEventListener('click', () => {
        const newNumbers = generateLottoNumbers();
        displayNumbers(newNumbers);
    });

    // 앱 시작 시 초기 번호 생성
    const initialNumbers = generateLottoNumbers();
    displayNumbers(initialNumbers);
});