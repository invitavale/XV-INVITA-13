/* =========================================================
   XV ROYALE — lógica de la invitación (invitavale.com)
   ========================================================= */

// ---------- DATOS QUE SE EDITAN POR CLIENTE ----------
const CONFIG = {
    fechaEvento: '2026-12-20T18:00:00',          // fecha y hora de la fiesta (cuenta regresiva)
    fechaFin:    '2026-12-21T02:00:00',          // para "Agendar" en el calendario
    titulo:      'XV Años de Yerianny',
    lugar:       'Barceló Santo Domingo, Av. Máximo Gómez #53, esq. Av. 27 de Febrero, Santo Domingo',
    mapa:        'https://www.google.com/maps/search/?api=1&query=Barcel%C3%B3%20Santo%20Domingo',
    fotos:       'https://photos.app.goo.gl/p9PGQHWrvLG1Bpj28',
    regalos:     'https://cuentapro11.github.io/numero-cuenta-ejemplo/',
    confirmar:   'https://docs.google.com/forms/d/e/1FAIpQLSdIYoM33yAkMmS4DZCRVmO9_IE0gZT4eEw8cV0r2PgWlYE0Ag/viewform?usp=header',
    autoGaleria: 3500                            // ms entre fotos (0 = sin avance automático)
};

let isPlaying = false;
let userPausedMusic = false;

document.addEventListener('DOMContentLoaded', () => {
    setupGuest();
    setupLinks();
    initializeCountdown();
    initializeStack();
    initializeIntro();
    addGlitter();
    placeButterflies();
    setupScrollReveal();
    const audio = document.getElementById('bgMusic');
    document.getElementById('musicToggle').addEventListener('click', toggleMusic);
    audio.addEventListener('playing', () => { isPlaying = true; updateMusicIcon(); });
    audio.addEventListener('pause', () => { isPlaying = false; updateMusicIcon(); });
    updateMusicIcon();
});

// ---------- Pase de invitado por enlace ----------
// Ejemplo: index.html?n=Familia%20Pérez&p=2   (n = nombre, p = cantidad de pases)
// Sin parámetros, la tarjeta del pase se oculta.
function setupGuest() {
    const q = new URLSearchParams(location.search);
    const name = q.get('n') || q.get('invitado');
    const seats = parseInt(q.get('p') || q.get('pases'), 10);
    const pase = document.getElementById('pase');
    if (!name && document.documentElement.dataset.demo) return;   // vista previa: muestra el ejemplo
    if (!name) {
        pase.style.display = 'none';
        if (pase.nextElementSibling) pase.nextElementSibling.style.background = '#FFF9F2';
        return;
    }
    document.getElementById('guestName').textContent = name;
    if (seats > 0) {
        document.getElementById('guestSeats').textContent = seats;
        document.getElementById('guestSeatsTxt').textContent = seats === 1 ? 'persona' : 'personas';
    } else {
        document.getElementById('guestStub').style.display = 'none';
        document.querySelector('#pase .pass').style.gridTemplateColumns = '1fr';
    }
}

// ---------- Intro: video de la puerta ----------
// El toque del invitado arranca el video (con su sonido) y la música en el
// mismo gesto, que es lo que exigen iPhone y Android. En el segundo 3 se
// apaga el sonido del video y queda solo la música.
const VIDEO_SONIDO_HASTA = 3;

function initializeIntro() {
    const intro = document.getElementById('introVideo');
    const video = document.getElementById('doorVideo');
    const audio = document.getElementById('bgMusic');
    const root = document.documentElement;
    if (!intro || !video) { root.classList.remove('intro-lock'); return; }

    let started = false, finished = false;

    const finish = () => {
        if (finished) return;
        finished = true;
        window.scrollTo(0, 0);
        intro.classList.add('is-leaving');
        root.classList.remove('intro-lock');
        root.classList.add('intro-done');
        setTimeout(() => intro.remove(), 2000);
        subirMusica(audio);
    };

    const start = () => {
        if (started) return;
        started = true;
        intro.classList.add('is-playing');
        document.getElementById('musicPlayer').style.display = 'block';

        if (audio) {
            try { audio.currentTime = 0; } catch (e) {}
            audio.muted = false;
            try { audio.volume = 0.55; } catch (e) {}
            const pa = audio.play();
            if (pa && pa.catch) pa.catch(() => {});
        }

        video.muted = false;
        try { video.volume = 1; } catch (e) {}
        let silenciado = false;
        const silenciar = () => {
            if (silenciado) return;
            silenciado = true;
            apagarSonido(video);
            subirMusica(audio);
        };
        video.addEventListener('timeupdate', function onT() {
            if (video.currentTime >= VIDEO_SONIDO_HASTA) {
                video.removeEventListener('timeupdate', onT);
                silenciar();
            }
        });
        setTimeout(silenciar, (VIDEO_SONIDO_HASTA + 1) * 1000);

        const pv = video.play();
        if (pv && pv.catch) {
            pv.catch(() => {
                video.muted = true;
                video.play().catch(() => finish());
            });
        }
        video.addEventListener('timeupdate', function nearEnd() {
            if (isFinite(video.duration) && video.currentTime >= video.duration - 0.6) {
                video.removeEventListener('timeupdate', nearEnd);
                finish();
            }
        });
        video.addEventListener('ended', finish);
        const dur = isFinite(video.duration) && video.duration > 0 ? video.duration : 8;
        setTimeout(finish, (dur + 2.5) * 1000);

        // Si el teléfono no dejó sonar la música, el próximo toque la arranca
        const retry = () => {
            if (!audio || !audio.paused || userPausedMusic) {
                ['click', 'touchend'].forEach(ev => document.removeEventListener(ev, retry, true));
                return;
            }
            audio.play().catch(() => {});
        };
        setTimeout(() => ['click', 'touchend'].forEach(ev => document.addEventListener(ev, retry, true)), 600);
    };

    intro.addEventListener('click', start);
    intro.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); }
    });
    video.addEventListener('error', () => { if (started) finish(); });
}

function apagarSonido(video) {
    if (!video || video.muted) return;
    let v = video.volume;
    const fade = setInterval(() => {
        v = Math.max(0, v - 0.1);
        try { video.volume = v; } catch (e) {}
        if (v <= 0) { clearInterval(fade); video.muted = true; }
    }, 40);
}

function subirMusica(audio) {
    if (!audio || userPausedMusic) return;
    if (audio.paused) audio.play().catch(() => {});
    let v = audio.volume;
    const fade = setInterval(() => {
        v = Math.min(1, v + 0.05);
        try { audio.volume = v; } catch (e) {}
        if (v >= 1) clearInterval(fade);
    }, 80);
}

// ---------- Música ----------
function toggleMusic() {
    const audio = document.getElementById('bgMusic');
    if (audio.paused) { userPausedMusic = false; audio.play().catch(() => {}); }
    else { userPausedMusic = true; audio.pause(); }
}

function updateMusicIcon() {
    const icon = document.getElementById('volumeIcon');
    if (!icon) return;
    icon.innerHTML = isPlaying
        ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#6E3448"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08" stroke="#6E3448" stroke-width="2" stroke-linecap="round"/>'
        : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#6E3448"/><line x1="16" y1="9" x2="22" y2="15" stroke="#6E3448" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="9" x2="16" y2="15" stroke="#6E3448" stroke-width="2" stroke-linecap="round"/>';
}

// ---------- Cuenta regresiva ----------
function initializeCountdown() {
    const target = new Date(CONFIG.fechaEvento).getTime();
    const ids = ['days', 'hours', 'minutes', 'seconds'];
    function tick() {
        let d = Math.max(0, target - Date.now());
        const vals = [
            Math.floor(d / 86400000),
            Math.floor(d % 86400000 / 3600000),
            Math.floor(d % 3600000 / 60000),
            Math.floor(d % 60000 / 1000)
        ];
        ids.forEach((id, i) => { document.getElementById(id).textContent = String(vals[i]).padStart(2, '0'); });
    }
    tick();
    setInterval(tick, 1000);
}

// ---------- Galería: polaroids apiladas ----------
function initializeStack() {
    const stack = document.getElementById('stack');
    if (!stack) return;
    const cards = Array.from(stack.querySelectorAll('.pola'));
    const dotsBox = document.getElementById('dots');
    const n = cards.length;
    let current = 0, busy = false, timer = null;

    cards.forEach((_, i) => {
        const d = document.createElement('i');
        d.addEventListener('click', () => goTo(i));
        dotsBox.appendChild(d);
    });

    function layout() {
        cards.forEach((c, i) => {
            const pos = (i - current + n) % n;
            c.classList.remove('pos0', 'pos1', 'pos2', 'pos3', 'posx', 'out-l', 'out-r');
            c.classList.add(pos <= 3 ? 'pos' + pos : 'posx');
        });
        Array.from(dotsBox.children).forEach((d, i) => d.classList.toggle('on', i === current));
    }

    function advance(dir) {
        if (busy) return;
        busy = true;
        if (dir > 0) {
            // la foto de arriba sale volando y queda la siguiente
            const top = cards[current];
            top.classList.remove('pos0');
            top.classList.add('out-l');
            current = (current + 1) % n;
            setTimeout(() => { layout(); busy = false; }, 450);
            cards.forEach((c, i) => { if (i !== (current - 1 + n) % n) { const pos = (i - current + n) % n; c.classList.remove('pos0','pos1','pos2','pos3','posx'); c.classList.add(pos <= 3 ? 'pos' + pos : 'posx'); } });
            Array.from(dotsBox.children).forEach((d, i) => d.classList.toggle('on', i === current));
        } else {
            // la foto anterior regresa desde el lado
            current = (current - 1 + n) % n;
            const c = cards[current];
            c.style.transition = 'none';
            c.classList.remove('pos0','pos1','pos2','pos3','posx');
            c.classList.add('out-r');
            void c.offsetWidth;
            c.style.transition = '';
            layout();
            setTimeout(() => { busy = false; }, 500);
        }
    }

    function goTo(i) {
        if (i === current) return;
        current = i; layout(); restart();
    }

    function restart() {
        if (!CONFIG.autoGaleria) return;
        clearInterval(timer);
        timer = setInterval(() => advance(1), CONFIG.autoGaleria);
    }

    document.getElementById('nextBtn').addEventListener('click', () => { advance(1); restart(); });
    document.getElementById('prevBtn').addEventListener('click', () => { advance(-1); restart(); });

    // deslizar con el dedo
    let x0 = null;
    stack.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    stack.addEventListener('touchend', e => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) { advance(dx < 0 ? 1 : -1); restart(); }
        x0 = null;
    });
    // y con el mouse en computadora
    stack.addEventListener('mousedown', e => { x0 = e.clientX; });
    stack.addEventListener('mouseup', e => {
        if (x0 === null) return;
        const dx = e.clientX - x0;
        if (Math.abs(dx) > 40) { advance(dx < 0 ? 1 : -1); restart(); }
        x0 = null;
    });

    layout();
    restart();
}

// ---------- Brillo: solo en las partes rosadas ----------
function addGlitter() {
    document.querySelectorAll('[data-glitter]').forEach(sec => {
        const count = parseInt(sec.getAttribute('data-glitter'), 10) || 50;
        const layer = document.createElement('div');
        layer.className = 'glit';
        layer.setAttribute('aria-hidden', 'true');
        const r = (a, b) => Math.random() * (b - a) + a;
        let html = '';
        for (let i = 0; i < count; i++) {
            const s = [1.5, 2, 2, 2.5, 3][Math.floor(Math.random() * 5)];
            html += `<i class="g" style="left:${r(1, 99).toFixed(1)}%;top:${r(1, 99).toFixed(1)}%;width:${s}px;height:${s}px;--o:${r(.4, .95).toFixed(2)};--d:${r(2, 4.5).toFixed(1)}s;--dl:-${r(0, 4).toFixed(1)}s"></i>`;
        }
        for (let i = 0; i < Math.round(count / 8); i++) {
            const s = Math.round(r(9, 18));
            html += `<b class="st" style="left:${r(3, 95).toFixed(1)}%;top:${r(3, 95).toFixed(1)}%;width:${s}px;height:${s}px;--d:${r(3, 6).toFixed(1)}s;--dl:-${r(0, 5).toFixed(1)}s"></b>`;
        }
        layer.innerHTML = html;
        sec.insertBefore(layer, sec.firstChild.nextSibling);
    });
}

// ---------- Mariposas que vuelan: solo en las partes rosadas ----------
// Cada una da vueltas suaves alrededor de su punto (a los lados), sin salir
// de su sección, y solo se anima cuando la sección está a la vista.
const BUTTERFLY_SPOTS = {
    hero: [[12, 70], [88, 80]],
    2: [[12, 18], [88, 70]],
    3: [[12, 14], [88, 46], [12, 84]]
};

function placeButterflies() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rand = (a, b) => Math.random() * (b - a) + a;
    const groups = [];

    document.querySelectorAll('[data-butterflies]').forEach(section => {
        const count = Math.min(3, parseInt(section.getAttribute('data-butterflies'), 10) || 0);
        if (!count) return;
        const spots = section.classList.contains('hero') ? BUTTERFLY_SPOTS.hero : BUTTERFLY_SPOTS[count];
        const layer = document.createElement('div');
        layer.className = 'butterfly-layer';
        layer.setAttribute('aria-hidden', 'true');
        section.appendChild(layer);

        const flies = spots.map(([px, py], k) => {
            const el = document.createElement('img');
            el.src = 'mariposa.webp';
            el.alt = '';
            el.className = 'butterfly';
            const size = rand(34, 50);
            el.style.width = size.toFixed(0) + 'px';
            el.style.transitionDelay = (k * 0.35) + 's';
            layer.appendChild(el);
            return { el, size, px, py, rx: rand(18, 28), ry: rand(10, 18), period: rand(7, 11),
                     spin: Math.random() < 0.5 ? 1 : -1, phase: rand(0, 6.28), bob: rand(2.5, 4), dir: 1, lastX: null };
        });
        groups.push({ section, layer, flies, visible: false });
    });

    function revisarVisibles() {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        groups.forEach(g => {
            const r = g.section.getBoundingClientRect();
            const visiblePx = Math.min(r.bottom, vh) - Math.max(r.top, 0);
            g.visible = visiblePx > Math.min(Math.max(1, r.height), vh) * 0.15;
            if (g.visible) g.layer.classList.add('is-on');
        });
    }

    const t0 = performance.now();
    function frame(now) {
        revisarVisibles();
        const t = (now - t0) / 1000;
        for (const g of groups) {
            if (!g.visible) continue;
            const W = g.layer.clientWidth, H = g.layer.clientHeight;
            for (const f of g.flies) {
                const hImg = f.el.offsetHeight || f.size * 0.85;
                const cx = Math.min(Math.max(W * f.px / 100, f.rx + f.size / 2), W - f.rx - f.size / 2);
                const cy = Math.min(Math.max(H * f.py / 100, f.ry + hImg / 2), H - f.ry - hImg / 2);
                const a = f.spin * (t / f.period) * 6.28 + f.phase;
                const x = cx + f.rx * Math.cos(a) + f.rx * 0.18 * Math.cos(2 * a) - f.size / 2;
                const y = cy + f.ry * Math.sin(a) + Math.sin(t * f.bob * 6.28) * 2.5 - hImg / 2;
                const vx = f.lastX === null ? 0 : x - f.lastX;
                f.lastX = x;
                const target = vx < -0.02 ? -1 : (vx > 0.02 ? 1 : (f.dir >= 0 ? 1 : -1));
                f.dir += (target - f.dir) * 0.08;
                const tilt = Math.max(-14, Math.min(14, vx * 12));
                f.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${tilt.toFixed(1)}deg) scaleX(${f.dir.toFixed(3)})`;
            }
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

// ---------- Aparición al hacer scroll + efectos al deslizar ----------
function setupScrollReveal() {
    let pendientes = Array.from(document.querySelectorAll('.reveal'));
    const heroBg = document.querySelector('.hero-bg');
    const tl = document.getElementById('timeline');
    const lugar = document.getElementById('lugarImg');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function revisar() {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (pendientes.length) {
            pendientes = pendientes.filter(el => {
                if (el.getBoundingClientRect().top < vh * 0.9) { el.classList.add('is-visible'); return false; }
                return true;
            });
        }
        if (reduce) return;
        const y = window.scrollY || window.pageYOffset;
        // portada: la foto se mueve más lento que la página
        if (heroBg && y < vh * 1.2) heroBg.style.transform = `translateY(${(y * 0.35).toFixed(1)}px) scale(${(1 + y * 0.0002).toFixed(4)})`;
        // itinerario: la línea dorada se llena al bajar
        if (tl) {
            const r = tl.getBoundingClientRect();
            const p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / r.height));
            tl.style.setProperty('--p', p.toFixed(3));
        }
        // acuarela del lugar: leve acercamiento al pasar
        if (lugar) {
            const r = lugar.getBoundingClientRect();
            const c = (r.top + r.height / 2 - vh / 2) / vh;      // -1..1 aprox
            lugar.style.transform = `translateY(${(c * -18).toFixed(1)}px) scale(${(1.04 - Math.abs(c) * 0.04).toFixed(3)})`;
        }
    }
    window.addEventListener('scroll', revisar, { passive: true });
    window.addEventListener('resize', revisar);
    (function bucle() { revisar(); if (pendientes.length) requestAnimationFrame(bucle); })();
}

// ---------- Botones ----------
// Los enlaces se llenan desde CONFIG (son <a href>, funcionan en todos los teléfonos)
function setupLinks() {
    const urls = { mapa: CONFIG.mapa, fotos: CONFIG.fotos, regalos: CONFIG.regalos, confirmar: CONFIG.confirmar, calendario: calendarUrl() };
    document.querySelectorAll('[data-link]').forEach(a => { a.href = urls[a.dataset.link] || '#'; });
}
function calendarUrl() {
    const f = s => new Date(s).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
        '&text=' + encodeURIComponent(CONFIG.titulo) +
        '&dates=' + f(CONFIG.fechaEvento) + '/' + f(CONFIG.fechaFin) +
        '&location=' + encodeURIComponent(CONFIG.lugar);
}
function openLocation(e) { if (e) e.preventDefault(); window.open(CONFIG.mapa, '_blank'); }
function sharePhotos() { window.open(CONFIG.fotos, '_blank'); }
function showGifts() { window.open(CONFIG.regalos, '_blank'); }
function confirmAttendance() { window.open(CONFIG.confirmar, '_blank'); }

function addToCalendar(e) {
    if (e) e.preventDefault();
    const f = s => new Date(s).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
        '&text=' + encodeURIComponent(CONFIG.titulo) +
        '&dates=' + f(CONFIG.fechaEvento) + '/' + f(CONFIG.fechaFin) +
        '&location=' + encodeURIComponent(CONFIG.lugar);
    window.open(url, '_blank');
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(e, id) { document.getElementById(id).classList.remove('open'); }

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => t.classList.remove('show'), 2500);
}
