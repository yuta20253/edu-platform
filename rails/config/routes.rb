Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      devise_for :users,
        controllers: {
          sessions: "users/sessions",
          registrations: "users/registrations",
          passwords: "users/passwords",
          confirmations: "users/confirmations",
          unlocks: "users/unlocks"
        }

        devise_scope :users do
          post "/admin/login",  to: "admin/sessions#create"
          delete "/admin/logout", to: "admin/sessions#destroy"
          post "/teacher/login",  to: "teacher/sessions#create"
          post "/student/login",  to: "student/sessions#create"
          post "/parent/login",  to: "parent/sessions#create"
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
