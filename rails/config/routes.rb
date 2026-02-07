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

      resource :users, only: :show

      namespace :student do
        resource :dashboard, only: :show
        resources :goals
      end
      namespace :teacher do
      end
      namespace :admin do
      end
    end
  end

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
