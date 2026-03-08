function toggleDrawer() {
    document.getElementById('mobile-drawer').classList.toggle('open');
    document.getElementById('hamburger').classList.toggle('open');
}
function closeDrawer() {
    document.getElementById('mobile-drawer').classList.remove('open');
    document.getElementById('hamburger').classList.remove('open');
}

let toastTimer;
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.background =
        type === 'error'
            ? 'linear-gradient(135deg,#e74c3c,#c0392b)'
            : 'linear-gradient(135deg,#5BAD8F,#7ECBA6)';
    t.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        t.style.display = 'none';
    }, 2800);
}

function formatAge(age) {
    if (age <= 9) return '9歳以下';
    if (age >= 60) return '60歳以上';
    return age + '代';
}