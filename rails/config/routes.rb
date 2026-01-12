Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
        post "/student/login", to: "sessions#create"
        post "/student/signup", to: "registrations#create"
        post "/teacher/login", to: "sessions#create"
        post "/teacher/signup", to: "registrations#create"
        post "/admin/login", to: "sessions#create"
        post "/admin/signup",   to: "registrations#create"
      namespace :student do
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
