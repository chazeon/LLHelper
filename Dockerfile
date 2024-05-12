FROM python:2.7.17-alpine

WORKDIR /app

COPY . /app/

RUN python -m pip install -r requirements.txt

EXPOSE 8080

RUN /bin/sh ./update.sh local

ENV FLASK_RUN_HOST=0.0.0.0

CMD ["./run.sh", "8080"]
