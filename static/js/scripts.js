document.addEventListener('DOMContentLoaded', function() {
    // функція для переключення навігаційного меню на мобільних пристроях
    const navToggle = document.querySelector('.header__nav-toggle');
    const navMenu = document.querySelector('.header__nav-list');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // плавний скролл до секцій сторінки
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // додатковий функціонал: зміна тексту в футері при кліку
    const footerText = document.querySelector('.footer__copyright');
    if (footerText) {
        footerText.addEventListener('click', function() {
            const currentYear = new Date().getFullYear();
            if (this.textContent.includes('All rights reserved')) {
                this.textContent = `© ${currentYear} YID. Click for more info.`;
            } else {
                this.textContent = `© ${currentYear} YID. All rights reserved.`;
            }
        });
    }

    // покращення візуального вигляду калькулятора
    const calculateBtn = document.getElementById('calculate-btn');
    const resultDiv = document.getElementById('result');
    if (calculateBtn && resultDiv) {
        calculateBtn.addEventListener('click', function() {
            this.classList.add('button-click');
            setTimeout(() => this.classList.remove('button-click'), 300);
            setTimeout(() => {
                resultDiv.style.opacity = '0';
                setTimeout(() => {
                    resultDiv.style.transition = 'opacity 0.5s';
                    resultDiv.style.opacity = '1';
                }, 10);
            }, 100);
        });
        if (document.getElementById('calculator-form')) {
            document.getElementById('calculator-form').addEventListener('input', function() {
                resultDiv.style.opacity = '0';
            });
        }
    }

    // анімація геройського блоку
    const heroTitle = document.querySelector('.header__hero-title');
    const heroDescription = document.querySelector('.header__hero-description');
    if (heroTitle && heroDescription) {
        setTimeout(() => {
            heroTitle.style.opacity = '1';
            heroTitle.style.transform = 'translateY(0)';
        }, 500);
        setTimeout(() => {
            heroDescription.style.opacity = '1';
            heroDescription.style.transform = 'translateY(0)';
        }, 1000);
    }

    // анімація при скроллі для блоку введення
    const introduction = document.querySelector('.introduction');
    if (introduction) {
        window.addEventListener('scroll', function() {
            const introPosition = introduction.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            if (introPosition < screenPosition) {
                introduction.classList.add('fade-in');
            }
        });
    }

    // додавання класів для анімації при завантаженні сторінки
    document.body.classList.add('loaded');

    // анімація для елементів послуг і членів команди
    const animateElements = (selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length) {
            elements.forEach((element, index) => {
                setTimeout(() => {
                    element.classList.add('fade-in');
                }, index * 300);
            });
            window.addEventListener('scroll', function() {
                elements.forEach(element => {
                    const elementPosition = element.getBoundingClientRect().top;
                    const screenPosition = window.innerHeight / 1.3;
                    if (elementPosition < screenPosition) {
                        element.classList.add('fade-in');
                    }
                });
            });
        }
    };

    animateElements('.service-item');
    animateElements('.team-member');
});

// функція для відкриття/закриття модального вікна (якщо є така необхідність)
function toggleModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.toggle('show-modal');
    }
}