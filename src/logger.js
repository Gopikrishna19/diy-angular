export default function logger(type, ...args) {

    console[type](...args); // eslint-disable-line no-console

}
