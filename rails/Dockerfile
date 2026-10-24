FROM ruby:3.4.12-bookworm

RUN apt-get update -qq && apt-get install -y \
  build-essential \
  default-libmysqlclient-dev \
  nodejs \
  yarn \
  vim

WORKDIR /rails

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .

CMD ["bash"]
