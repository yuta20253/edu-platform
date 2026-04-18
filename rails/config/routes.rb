Rails.application.routes.draw do
  devise_for :users, skip: [:sessions, :registrations]

  namespace :api do
    namespace :v1 do
      devise_scope :user do
        post "/user/login", to: "sessions#create"
        delete "/user/logout", to: "sessions#destroy"
        post "/student/signup", to: "registrations#create"
        post "/teacher/signup", to: "registrations#create"
        post "/admin/signup",   to: "registrations#create"
      end

      post "/password/reset/request", to: "password_resets#create"
      patch "/password/reset", to: "password_resets#update"

      get "/me", to: "users#show"
      patch "/profile", to: "profiles#update"

      resources :prefectures, only: :index
      resources :addresses, only: :index

      resources :high_schools do
        resources :grades, only: :index
      end

      namespace :student do
        resource :dashboard, only: :show
        resources :goals
        resources :draft_tasks
        resources :tasks do
          resources :units, only: :show
        end
        resources :courses, only: :index
      end

      namespace :teacher do
        resources :colleagues, controller: "teachers"
        resources :students
        resource :dashboard, only: :show
      end

      namespace :admin do
        resource :dashboard, only: :show
        resources :high_schools, only: [:index, :show] do
          resources :teachers, only: [:index, :create, :update]
        end
        resources :courses do
          resources :units do
            resource :import_questions, only: :create
          end
        end
      end
    end
  end

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?

  # Defines the root path route ("/")
  # root "posts#index"
end
