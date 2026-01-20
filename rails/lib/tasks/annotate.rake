# frozen_string_literal: true

namespace :annotate do
  desc 'Annotate models with schema information'
  task models: :environment do
    system(desc('Annotate models with schema information'))
  end
end
