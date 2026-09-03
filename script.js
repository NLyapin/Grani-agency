document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('year').textContent = new Date().getFullYear();

  gsap.registerPlugin(ScrollTrigger);

  initPhotoCarousel();

  /* ---------------- custom cursor ---------------- */
  const cursor = document.getElementById('cursor');
  const isTouch = window.matchMedia('(max-width: 900px)').matches;

  if (!isTouch && cursor) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    const tick = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    tick();

    const hoverables = document.querySelectorAll('a, button, input, .service-card, .project-card');
    hoverables.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
  }

  /* ---------------- preloader ---------------- */
  const preloader = document.getElementById('preloader');
  const plLogo = preloader.querySelector('.preloader__logo');
  const plBar = preloader.querySelector('.preloader__bar span');

  const introTl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: runHeroIntro
  });

  introTl
    .to(plLogo, { opacity: 1, y: 0, duration: 0.7 })
    .to(plBar, { width: '100%', duration: 1.1, ease: 'power1.inOut' }, '-=0.3')
    .to(preloader, {
      opacity: 0, duration: 0.7, ease: 'power2.inOut',
      onStart: () => preloader.classList.add('is-done')
    }, '+=0.15')
    .set(preloader, { display: 'none' });

  /* ---------------- hero intro ---------------- */
  function runHeroIntro() {
    document.body.style.overflow = '';

    const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    heroTl
      .to('.hero__img .ph', { opacity: 1, duration: 0.1 })
      .fromTo('.hero__img', { clipPath: 'inset(0 0 100% 0)' }, {
        clipPath: 'inset(0 0 0% 0)', duration: 1.2, stagger: 0.12
      }, 0)
      .from('.hero__script', { y: 24, opacity: 0, duration: 0.8 }, 0.6)
      .from('.hero__title', { y: 40, opacity: 0, duration: 0.9 }, 0.7)
      .from('.hero__plaque', { y: 20, opacity: 0, duration: 0.7 }, 0.95)
      .from('.hero__content .btn', { y: 20, opacity: 0, duration: 0.7 }, 1.05)
      .from('.hero__scroll', { opacity: 0, duration: 0.8 }, 1.2);
  }

  document.body.style.overflow = 'hidden';
  setTimeout(() => { document.body.style.overflow = ''; }, 3000);

  /* ---------------- scroll reveals ---------------- */
  gsap.utils.toArray('.reveal-up').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
      },
      delay: (i % 4) * 0.06
    });
  });

  gsap.utils.toArray('.about__img, .service-card__img, .project-card__img').forEach(el => {
    const ph = el.querySelector('.ph');
    if (!ph) return;
    gsap.set(ph, { opacity: 0, scale: 1.15 });
    gsap.to(ph, {
      opacity: 1,
      scale: 1,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  /* ---------------- stat counters ---------------- */
  gsap.utils.toArray('.stats__num').forEach(num => {
    const target = parseInt(num.dataset.count, 10);
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: num,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => { num.textContent = Math.round(obj.val); }
        });
      }
    });
  });

  /* ---------------- header shrink on scroll ---------------- */
  const header = document.getElementById('header');
  ScrollTrigger.create({
    start: 100,
    end: 99999,
    onUpdate: self => {
      header.classList.toggle('is-compact', self.scroll() > 80);
    }
  });

  /* ---------------- active nav link on scroll ---------------- */
  const navLinks = document.querySelectorAll('.main-nav__link');
  const sections = ['hero', 'services', 'about', 'portfolio', 'contacts']
    .map(id => document.getElementById(id) || document.querySelector(`#${id}`))
    .filter(Boolean);

  sections.forEach((sec, idx) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top center',
      end: 'bottom center',
      onToggle: self => {
        if (!self.isActive) return;
        navLinks.forEach(l => l.classList.remove('is-active'));
        const match = document.querySelector(`.main-nav__link[href="#${sec.id}"]`);
        if (match) match.classList.add('is-active');
        else if (sec.id === 'hero') navLinks[0]?.classList.add('is-active');
      }
    });
  });

  /* ---------------- search panel ---------------- */
  const searchPanel = document.getElementById('searchPanel');
  document.getElementById('searchToggle').addEventListener('click', () => {
    searchPanel.classList.add('is-open');
    setTimeout(() => searchPanel.querySelector('input').focus(), 350);
  });
  document.getElementById('searchClose').addEventListener('click', () => {
    searchPanel.classList.remove('is-open');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') searchPanel.classList.remove('is-open');
  });

  /* ---------------- photo carousel ---------------- */
  // Изображения подтягиваются из assets/carousel/ через /api/carousel.
  // Чтобы добавить или убрать фото из карусели — просто добавьте/удалите файл в этой папке.
  function initPhotoCarousel() {
    const section = document.getElementById('photoCarousel');
    const track = document.getElementById('photoCarouselTrack');
    if (!section || !track) return;

    const FALLBACK_IMAGES = ['1.jpg', '2.jpeg', '3.JPG', '4.jpg', '5.png', '6.png'];
    const PX_PER_SECOND = 60;

    fetch('/api/carousel', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => Array.isArray(data.images) && data.images.length ? data.images : Promise.reject())
      .catch(() => FALLBACK_IMAGES)
      .then(images => buildCarousel(images))
      .catch(() => {});

    function buildCarousel(images) {
      if (!images || !images.length) return;

      track.innerHTML = '';

      // дублируем список дважды, чтобы лента прокручивалась бесшовно и начиналась заново
      const loopImages = images.concat(images);

      loopImages.forEach((name, i) => {
        const slide = document.createElement('div');
        slide.className = 'photo-carousel__slide';

        const img = document.createElement('img');
        img.src = `assets/carousel/${encodeURIComponent(name)}`;
        img.alt = `Grani — фото с мероприятия ${(i % images.length) + 1}`;
        img.loading = i < images.length ? 'eager' : 'lazy';
        img.decoding = 'async';

        slide.appendChild(img);
        track.appendChild(slide);
      });

      section.hidden = false;

      const imgs = Array.from(track.querySelectorAll('img'));
      const whenLoaded = img => new Promise(resolve => {
        if (img.complete) return resolve();
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
      const safetyTimeout = new Promise(resolve => setTimeout(resolve, 4000));

      Promise.race([Promise.all(imgs.map(whenLoaded)), safetyTimeout])
        .then(() => {
          const singleSetWidth = track.scrollWidth / 2;
          const duration = Math.max(singleSetWidth / PX_PER_SECOND, 12);
          track.style.animationDuration = `${duration}s`;
          track.classList.add('is-ready');
        });

      track.addEventListener('mouseenter', () => track.classList.add('is-paused'));
      track.addEventListener('mouseleave', () => track.classList.remove('is-paused'));
    }
  }

});
