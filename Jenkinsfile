pipeline {
  agent any
  stages {
    stage('Install node') {
      steps {
        nvm(version: 'lts/carbon') {
          sh '''
            node -v
            npm i -g npm@^5.7
            npm -v
          '''
        }
      }
    }
    stage('Install packages') {
      steps {
        nvm(version: 'lts/carbon') {
          sh 'npm ci'
        }
      }
    }
    stage('Verify code') {
      parallel {
        stage('Run tests') {
          steps {
            nvm(version: 'lts/carbon') {
              sh 'npm run test'
            }
          }
        }
        stage('Lint code') {
          steps {
            nvm(version: 'lts/carbon') {
              sh 'npm run eslint'
            }
          }
        }
      }
    }
  }
}
