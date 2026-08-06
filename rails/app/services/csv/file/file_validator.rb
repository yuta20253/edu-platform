# frozen_string_literal: true

module Csv
  module File
    class FileValidator
      ALLOWED_TYPES = 'text/csv'
      ALLOWED_EXTENSIONS = ['.csv'].freeze
      MAX_FILE_SIZE = 5.megabytes

      def initialize(file)
        @file = file
      end

      def call
        Rails.logger.info("CSV Upload: filename=#{@file.original_filename}, content_type=#{@file.content_type}")

        # ファイルが存在しない
        raise Csv::Errors::InvalidFileType, 'ファイルが存在しません' if @file.blank?

        # ファイル形式が不正
        raise Csv::Errors::InvalidFileType, 'CSVファイルのみアップロード可能です' unless valid_content_type? && valid_extension?

        # ファイルサイズが上限を超えている
        return if valid_size?

        raise Csv::Errors::InvalidFileType, "ファイルサイズは#{MAX_FILE_SIZE / 1.megabyte}MB以内にしてください"
      end

      private

      def valid_content_type?
        @file.content_type == ALLOWED_TYPES
      end

      def valid_extension?
        ALLOWED_EXTENSIONS.include?(::File.extname(@file.original_filename).downcase)
      end

      def valid_size?
        @file.size <= MAX_FILE_SIZE
      end
    end
  end
end
