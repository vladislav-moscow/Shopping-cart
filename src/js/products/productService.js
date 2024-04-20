import { nanoid } from 'nanoid'
import { generateProductCardHTML } from './productCard'
import { form } from '../selectors/selectors'

let PRODDUCTS = [] // Переменная для хранения данных о продуктах.
// Глобальная переменная для хранения товаров в корзине
let cart = []

// Функция подгрузки данных из db.json
export async function loadJSON() {
  try {
    const response = await fetch('http://localhost:3000/products')
    PRODDUCTS = await response.json()

    console.log('Данные из db.json:', PRODDUCTS)

    if (Array.isArray(PRODDUCTS)) PRODDUCTS.forEach((product) => generateProductCardHTML(product))
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  }
}

/**
 * Функция обработки кликов и добавления товара в корзину по его ID
 * @param {MouseEvent} event - Событие клика
 */
export function addProductToBasket(event) {
  // Получаем id карточки
  const id = event.currentTarget.parentElement?.dataset?.id

  // Находим товар по его ID в PRODDUCTS
  const product = findProductById(id, PRODDUCTS)

  if (product) {
    // Добавляем товар в корзину и т.д.
    addToCart(product)
  } else {
    console.error(`Товар с ID ${id} не найден`)
  }
}

/**
 * Функция для добавления товара в корзину
 * @param {Object} product - Объект товара
 */
function addToCart(product) {
  // Создаем объект для представления товара в корзине
  console.log(product)
  const cartItem = {
    id: product.id, // Используем ID товара для идентификации товара в корзине
    name: product.name,
    price: product.price,
    imgSrc: product.imgSrc,
    quantity: 1, // Начальное количество товара в корзине
  }
  // Проверяем, есть ли уже такой товар в корзине
  const existingItemIndex = cart.findIndex((item) => item.id === cartItem.id)

  if (existingItemIndex !== -1) {
    // Если товар уже есть в корзине, увеличиваем его количество
    cart[existingItemIndex].quantity++
  } else {
    // Если товара еще нет в корзине, добавляем его
    cart.push(cartItem)
  }

  // Обновляем интерфейс корзины
  updateCartUI()
}

function updateCartUI() {
  // Получаем элемент корзины из DOM
  const cartElement = document.getElementById('basket-list')
  const quantityProductInBasket = document.querySelector('.basket-count__info')
  const totalPriceElement = document.getElementById('total-price')

  // Очищаем содержимое корзины
  cartElement.innerHTML = ''

  // Перебираем все товары в корзине
  cart.forEach((item) => {
    // Создаем элемент для отображения товара в корзине
    const itemElement = document.createElement('div')
    itemElement.classList.add('cart-item')
    console.log(item)

    // Заполняем содержимое элемента информацией о товаре
    itemElement.innerHTML = `
			
				<img src="${item?.imgSrc}" class="cart-item-img"/>
      	<div class="cart-item-name">${item.name}</div>
      	<div class="cart-item-quantity">Quantity: ${item.quantity}</div>
      	<div class="cart-item-price">Price: ${item.price}</div>
			
    `

    // Добавляем элемент товара в корзину
    cartElement.appendChild(itemElement)
  })

  // Подсчитываем общую стоимость товаров в корзине
  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0)
  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  // Обновляем отображение общей стоимости в интерфейсе
  quantityProductInBasket.textContent = totalQuantity
  totalPriceElement.textContent = totalPrice.toFixed(2)
}

/**
 * Функция для поиска товара по его ID в базе данных
 * @param {string} id - Идентификатор товара
 * @param {Array<Object>} products - Массив товаров
 * @returns {Object|null} - Найденный товар или null, если товар не найден
 */
export function findProductById(id, products) {
  // Находим товар по его ID в переданном массиве
  const foundProduct = products.find((product) => product.id === id)

  return foundProduct || null
}

/**
 * Обработчик отправки формы для добавления нового товара.
 * @param {Event} event - Событие отправки формы.
 * @returns {Promise<void>} - Промис.
 */
export const handleFormSubmit = async (event) => {
  event.preventDefault() // предотвр. отправку данных

  // Целевой элемент, на к-ом произошел клик (форма)
  const form = event.target

  // Получаем все инпуты внутри формы
  const inputLists = form.querySelectorAll('input')

  // Объект для отправки на бек
  const newProduct = {
    id: nanoid(),
  }

  // пополняем объект по атрибуту name инпутов
  inputLists.forEach((input) => (newProduct[input?.name] = input?.value))

  // добавляем категорию товара в объект newProduct
  newProduct.category = document.querySelector('#productCategory')?.value

  try {
    const response = await fetch('http://localhost:3000/products', {
      method: 'POST', // Здесь так же могут быть GET, PUT, DELETE
      body: JSON.stringify(newProduct), // Тело запроса в JSON-формате
      headers: {
        // Добавляем необходимые заголовки
        'Content-type': 'application/json; charset=UTF-8',
      },
    })

    if (response.ok) {
      // Показ компонента уведомления
      const notificationInfo = new Notification({
        variant: 'green',
        title: 'Добавление товара',
        subtitle: 'Товар добавлен на страницу',
      })

      // Обновляем полученные ранее данные
      PRODDUCTS.push(newProduct)

      // Вставляем новую карточку товара в HTML
      generateProductCardHTML(newProduct)
    } else {
      console.error('Ошибка при добавлении товара:', response.statusText)
    }
  } catch (error) {
    console.error('Ошибка при отправке данных на сервер:', error)
  }
}

// Привязываем обработчик submit к форме
form.addEventListener('submit', handleFormSubmit)
