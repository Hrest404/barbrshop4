import bot from './bot'

// Устанавливаем команды меню в Telegram
bot.api.setMyCommands([
  { command: 'start', description: 'Главное меню' },
  { command: 'book', description: 'Записаться' },
  { command: 'mybookings', description: 'Мои записи' },
  { command: 'help', description: 'Помощь' },
]).catch(console.error)

// Запуск в режиме long polling (для разработки)
bot.start({
  onStart: (info) => {
    console.log(`🤖 Bot @${info.username} started (long polling)`)
    console.log(`🔗 Open: https://t.me/${info.username}`)
  },
})
