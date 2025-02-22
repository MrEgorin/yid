document.addEventListener('DOMContentLoaded', () => {
    const navList = document.querySelector('.header__nav-list');
    const navToggle = document.querySelector('.header__nav-toggle');
    const pages = [
        { name: 'Home', url: '/' },  // Змінено на кореневий маршрут Django
        { name: 'About', url: '/about/' },  // Приклад маршруту для About, якщо є
        { name: 'Services', url: '/services/' },  // Приклад маршруту для Services
        { name: 'Team', url: '/team/' },  // Приклад маршруту для Team
        { name: 'Calculator', url: '/calculator/' },  // Приклад маршруту для Calculator
        { name: 'PDB Viewer', url: '/' }  // Змінено pdb-viewer.html на кореневий маршрут для PDB Viewer
    ];

    // Генерація пунктів меню
    navList.innerHTML = '';
    pages.forEach(page => {
        const li = document.createElement('li');
        li.className = 'header__nav-item';
        const a = document.createElement('a');
        a.href = page.url;
        a.className = 'header__nav-link';
        a.textContent = page.name;

        // Визначення активного пункту меню
        if (window.location.pathname === page.url || (page.url === '/' && window.location.pathname === '')) {
            a.classList.add('header__nav-link--active');
        }

        li.appendChild(a);
        navList.appendChild(li);
    });

    // Логіка для бургер-меню
    navToggle.addEventListener('click', () => {
        navList.classList.toggle('header__nav-list--active');
        navToggle.classList.toggle('header__nav-toggle--active');
    });

    // Закриття меню при кліку на пункт меню (для мобільних)
    navList.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && navList.classList.contains('header__nav-list--active')) {
            navList.classList.remove('header__nav-list--active');
            navToggle.classList.remove('header__nav-toggle--active');
        }
    });
});