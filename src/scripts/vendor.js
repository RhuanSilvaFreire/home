// Libs do npm expostas como globais (fx.js e home.js leem window.gsap / ScrollTrigger / Lenis)
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
window.Lenis = Lenis;
