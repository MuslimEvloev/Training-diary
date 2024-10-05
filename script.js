"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class WorkOut {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    //prettier-ignore
    const months = ["January","February",
    "March","April","May","June","July","August","September","October","November","December",
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends WorkOut {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends WorkOut {
  type = "cycling";
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  _workouts = [];
  _map;
  _mapEvent;
  constructor() {
    //Запуск логики приложения
    this._getPosition();
    //Получение данных из LS
    this._getLocalStorage();
    //Обработчик события который вызывает метод _newWorkout
    form.addEventListener("submit", this._newWorkOut.bind(this));
    //Обработчик события который вызывает метод _toggleField
    inputType.addEventListener("change", this._toggleField.bind(this));

    containerWorkouts.addEventListener("click", this._moveToPopUp.bind(this));
  }

  //Метод запроса данных о местопложении от пользователя.В случае успеха запускается функция _loadMap

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),

        //Модальное окно в случае отказа

        function () {
          alert("Вы не предоставили доступ к своей локации");
        }
      );
    }
  }

  //Метод загрузки карты на страницу, в случае положительного ответа о предоставлении своих координат

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const cords = [latitude, longitude];
    this._map = L.map("map").setView(cords, 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    //Обработчик события нажатия по карте, который запустит метод _showForm

    this._map.on("click", this._showForm.bind(this));

    this._workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  //Метод который отобразит форму при клике на карту
  _showForm(mapE) {
    this._mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  //Метод который переключает типы тренировок

  _toggleField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  //Метод который установит маркер на карту

  _newWorkOut(e) {
    e.preventDefault();
    const inputValid = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const inputValidSign = (...inputs) => inputs.every((inp) => inp > 0);
    //Данные из форм
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this._mapEvent.latlng;
    let workout;
    if (type === "running") {
      const cadence = +inputCadence.value;
      //Проверить что данные корректны
      if (
        !inputValid(distance, duration, cadence) ||
        !inputValidSign(distance, duration, cadence)
      ) {
        return alert("Необходимо ввести целое положительное число");
      }
      //Если пробежка, создать объект пробежки
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !inputValid(distance, duration, elevation) ||
        !inputValidSign(distance, duration)
      ) {
        return alert("Необходимо ввести целое положительное число");
      }
      //Если это велосипед, создать объект велосипеда
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //Добавить объект в массив workOut
    this._workouts.push(workout);
    console.log(this._workouts);

    //Рендер маркера тренировки на карте
    this._renderWorkoutMarker(workout);
    //Рендер тренировок после отправки формы
    this._renderWorkOut(workout);
    //Очистить поля ввода и спрятать форму
    this._hideForm();

    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: "mark-popup",
          content: `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${
            workout.description
          }`,
        })
      )

      .openPopup();
  }
  //Очистить поля ввода и спрятать форму
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    form.classList.add("hidden");
  }

  //Рендер тренировок
  _renderWorkOut(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">мин</span>
          </div>
         `;
    if (workout.type === "running") {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">мин/км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">шаг</span>
          </div>
        </li>`;
    }
    if (workout.type === "cycling") {
      html += ` <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">км/час</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">м</span>
        </div>
        </li>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }
  _moveToPopUp(e) {
    const workoutEL = e.target.closest(".workout");
    if (!workoutEL) return;
    const workout = this._workouts.find(
      (work) => work.id == workoutEL.dataset.id
    );
    console.log(workoutEL);
    this._map.setView(workout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this._workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    console.log(data);
    if (!data) return;

    this._workouts = data;
    this._workouts.forEach((work) => {
      this._renderWorkOut(work);
    });
  }

  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

//Запуск приложения
const app = new App();
