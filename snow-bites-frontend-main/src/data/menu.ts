import heroBg from '@/assets/hero-bg.jpg';
import pizzaImg from '@/assets/pizza.jpg';
import shawarmaImg from '@/assets/shawarma.jpg';
import noodlesImg from '@/assets/noodles.jpg';
import chickenImg from '@/assets/chicken.jpg';
import friesImg from '@/assets/fries.jpg';
import burger2Img from '@/assets/burger2.jpg';

export { heroBg };

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description?: string;
  badge?: string;
}

export const categories = [
  { id: 'all', label: 'All Items', icon: 'all' },
  { id: 'burgers', label: 'Burgers', icon: 'burgers' },
  { id: 'pizza', label: 'Pizza', icon: 'pizza' },
  { id: 'chinese', label: 'Chinese', icon: 'chinese' },
  { id: 'noodles', label: 'Noodles', icon: 'noodles' },
  { id: 'shawarma', label: 'Shawarma', icon: 'shawarma' },
  { id: 'sides', label: 'Sides & More', icon: 'sides' },
];

export const menuItems: MenuItem[] = [
  // Burgers
  { id: 'b1', name: 'Classic Smash Burger', price: 350, category: 'burgers', image: burger2Img, description: 'Juicy beef patty with cheese', badge: 'Bestseller' },
  { id: 'b2', name: 'Zinger Burger', price: 400, category: 'burgers', image: burger2Img, description: 'Crispy chicken with spicy mayo' },
  { id: 'b3', name: 'Double Trouble Burger', price: 550, category: 'burgers', image: burger2Img, description: 'Double patty, double cheese', badge: 'Premium' },
  { id: 'b4', name: 'BBQ Bacon Burger', price: 500, category: 'burgers', image: burger2Img, description: 'Smoky BBQ with crispy bacon' },
  // Pizza
  { id: 'p1', name: 'Fajita Pizza (S)', price: 600, category: 'pizza', image: pizzaImg, description: 'Chicken fajita loaded' },
  { id: 'p2', name: 'Fajita Pizza (M)', price: 1000, category: 'pizza', image: pizzaImg, badge: 'Popular' },
  { id: 'p3', name: 'Fajita Pizza (L)', price: 1400, category: 'pizza', image: pizzaImg },
  { id: 'p4', name: 'Pepperoni Pizza (M)', price: 900, category: 'pizza', image: pizzaImg },
  { id: 'p5', name: 'Tikka Pizza (M)', price: 950, category: 'pizza', image: pizzaImg },
  // Chinese
  { id: 'c1', name: 'Chicken Manchurian', price: 450, category: 'chinese', image: chickenImg, description: 'Sweet & tangy sauce' },
  { id: 'c2', name: 'Chicken Chilli Dry', price: 400, category: 'chinese', image: chickenImg, badge: 'Spicy' },
  { id: 'c3', name: 'Sweet & Sour Chicken', price: 420, category: 'chinese', image: chickenImg },
  { id: 'c4', name: 'Dragon Chicken', price: 480, category: 'chinese', image: chickenImg },
  // Noodles
  { id: 'n1', name: 'Chow Mein', price: 350, category: 'noodles', image: noodlesImg, description: 'Classic stir-fried noodles' },
  { id: 'n2', name: 'Spicy Noodles', price: 380, category: 'noodles', image: noodlesImg, badge: 'Hot' },
  { id: 'n3', name: 'Egg Fried Noodles', price: 320, category: 'noodles', image: noodlesImg },
  // Shawarma
  { id: 's1', name: 'Chicken Shawarma', price: 250, category: 'shawarma', image: shawarmaImg, description: 'Classic wrap', badge: 'Bestseller' },
  { id: 's2', name: 'Shawarma Platter', price: 500, category: 'shawarma', image: shawarmaImg, description: 'With fries & dip' },
  { id: 's3', name: 'Double Shawarma', price: 400, category: 'shawarma', image: shawarmaImg },
  // Sides
  { id: 'f1', name: 'French Fries', price: 200, category: 'sides', image: friesImg },
  { id: 'f2', name: 'Loaded Fries', price: 350, category: 'sides', image: friesImg, badge: 'Popular' },
  { id: 'f3', name: 'Nuggets (6pc)', price: 300, category: 'sides', image: chickenImg },
  { id: 'f4', name: 'Coleslaw', price: 100, category: 'sides', image: friesImg },
];

export const featuredItems = menuItems.filter(i => i.badge);

export const testimonials = [
  { name: 'Diego R.', text: '¡Los mejores kabobs de Iquique! Entrega rápida y todo recién preparado.', rating: 5, initials: 'DR' },
  { name: 'Camila B.', text: 'Sus pizzas y platos a la parrilla son increíbles. Ingredientes frescos siempre.', rating: 5, initials: 'CB' },
  { name: 'Hassan M.', text: 'Pedimos tabla de kabobs para compartir en familia. ¡Porciones generosas y gran sabor!', rating: 5, initials: 'HM' },
  { name: 'Valentina A.', text: 'Las papas cargadas son espectaculares y el delivery llega súper rápido.', rating: 4, initials: 'VA' },
];

export const menuCategories = [
  {
    id: 'burgers',
    icon: 'burgers',
    label: 'Burgers',
    items: [
      { name: 'Classic Smash Burger', s: 350 },
      { name: 'Zinger Burger', s: 400 },
      { name: 'Double Trouble Burger', s: 550 },
      { name: 'BBQ Bacon Burger', s: 500 },
      { name: 'Cheese Burger', s: 300 },
    ]
  },
  {
    id: 'pizza',
    icon: 'pizza',
    label: 'Pizza',
    items: [
      { name: 'Fajita Pizza', s: 600, m: 1000, l: 1400 },
      { name: 'Pepperoni Pizza', s: 500, m: 900, l: 1300 },
      { name: 'Tikka Pizza', s: 550, m: 950, l: 1350 },
      { name: 'Cheese Pizza', s: 450, m: 800, l: 1100 },
    ]
  },
  {
    id: 'chinese',
    icon: 'chinese',
    label: 'Chinese',
    items: [
      { name: 'Chicken Manchurian', s: 450 },
      { name: 'Chicken Chilli Dry', s: 400 },
      { name: 'Sweet & Sour Chicken', s: 420 },
      { name: 'Dragon Chicken', s: 480 },
      { name: 'Egg Fried Rice', s: 300 },
    ]
  },
  {
    id: 'noodles',
    icon: 'noodles',
    label: 'Noodles',
    items: [
      { name: 'Chow Mein', s: 350 },
      { name: 'Spicy Noodles', s: 380 },
      { name: 'Egg Fried Noodles', s: 320 },
      { name: 'Hakka Noodles', s: 360 },
    ]
  },
  {
    id: 'shawarma',
    icon: 'shawarma',
    label: 'Shawarma',
    items: [
      { name: 'Chicken Shawarma', s: 250 },
      { name: 'Double Shawarma', s: 400 },
      { name: 'Shawarma Platter', s: 500 },
    ]
  },
  {
    id: 'sides',
    icon: 'sides',
    label: 'Sides & More',
    items: [
      { name: 'French Fries', s: 200 },
      { name: 'Loaded Fries', s: 350 },
      { name: 'Nuggets (6pc)', s: 300 },
      { name: 'Coleslaw', s: 100 },
      { name: 'Soft Drinks', s: 80 },
    ]
  },
];
