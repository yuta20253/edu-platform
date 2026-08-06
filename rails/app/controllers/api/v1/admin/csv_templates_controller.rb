# frozen_string_literal: true

module Api
  module V1
    module Admin
      class CsvTemplatesController < Api::V1::Admin::BaseController
        def questions
          csv = ::Admin::QuestionCsvTemplateService.new.call

          send_data csv,
                    filename: 'questions_template.csv',
                    type: 'text/csv; charset=UTF-8',
                    disposition: 'attachment'
        end
      end
    end
  end
end
