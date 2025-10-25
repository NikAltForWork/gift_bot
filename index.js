const { Telegraf } = require('telegraf');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN || '8402137003:AAEVjFR22F1EcR0Nlt4gBW-bHjlfojUjrvs';
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || '@your_channel'; /
const CHANNEL_CHAT_ID = process.env.CHANNEL_CHAT_ID; 
const bot = new Telegraf(BOT_TOKEN);

async function checkSubscription(userId) {
    try {
        if (!CHANNEL_CHAT_ID) {
            console.error('CHANNEL_CHAT_ID не задан');
            return true; 
        }

        const member = await bot.telegram.getChatMember(CHANNEL_CHAT_ID, userId);
        const allowedStatuses = ['member', 'administrator', 'creator'];
        return allowedStatuses.includes(member.status);
    } catch (error) {
        console.error('Ошибка при проверке подписки:', error.message);
        
        
        if (error.response && error.response.error_code === 400) {
            console.error('Канал не найден. Проверьте CHANNEL_CHAT_ID:', CHANNEL_CHAT_ID);
        } else if (error.response && error.response.error_code === 403) {
            console.error('Бот не имеет доступа к каналу');
        }
        
        return false;
    }
}


async function subscriptionMiddleware(ctx, next) {
    
    if (ctx.message && (ctx.message.text === '/start' || ctx.message.text === '/get_chat_id')) {
        return next();
    }

    // Если CHANNEL_CHAT_ID не задан, пропускаем проверку
    if (!CHANNEL_CHAT_ID) {
        console.warn('CHANNEL_CHAT_ID не задан, проверка подписки отключена');
        return next();
    }

    const userId = ctx.from.id;
    const isSubscribed = await checkSubscription(userId);

    if (!isSubscribed) {
        await ctx.reply(
            `📢 Для использования бота необходимо подписаться на канал ${CHANNEL_USERNAME}\n\n` +
            `После подписки нажмите кнопку "Проверить подписку"`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '📺 Перейти в канал',
                                url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}`
                            }
                        ],
                        [
                            {
                                text: '✅ Проверить подписку',
                                callback_data: 'check_subscription'
                            }
                        ]
                    ]
                }
            }
        );
        return;
    }
    
    return next();
}

// Команда для получения ID чата (для отладки)
bot.command('get_chat_id', async (ctx) => {
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.forward_from_chat) {
        const chatId = ctx.message.reply_to_message.forward_from_chat.id;
        await ctx.reply(`ID чата: ${chatId}`);
    } else {
        await ctx.reply(
            'Чтобы получить ID чата, перешлите сообщение из канала этому боту и используйте команду /get_chat_id в ответ на пересланное сообщение'
        );
    }
});

// Обработчик команды /start
bot.start(async (ctx) => {
    if (!CHANNEL_CHAT_ID) {
        await ctx.reply(
            '⚠️ Бот настроен неправильно. CHANNEL_CHAT_ID не задан.\n\n' +
            'Для настройки:\n' + 
            '1. Добавьте бота в канал как администратора\n' +
            '2. Перешлите сообщение из канала боту\n' +
            '3. Используйте команду /get_chat_id в ответ на пересланное сообщение'
        );
        return;
    }

    const userId = ctx.from.id;
    const isSubscribed = await checkSubscription(userId);
    
    if (isSubscribed) {
        await ctx.reply('🎉 Вы подписаны на канал! Добро пожаловать!');
    } else {
        await ctx.reply(
            `👋 Для начала работы подпишитесь на канал ${CHANNEL_USERNAME}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '📺 Подписаться на канал',
                                url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}`
                            }
                        ],
                        [
                            {
                                text: '✅ Проверить подписку',
                                callback_data: 'check_subscription'
                            }
                        ]
                    ]
                }
            }
        );
    }
});

// Обработчик кнопки проверки подписки
bot.action('check_subscription', async (ctx) => {
    await ctx.answerCbQuery();
    
    const userId = ctx.from.id;
    const isSubscribed = await checkSubscription(userId);

    if (isSubscribed) {
        await ctx.editMessageText('✅ Ты подписан! Теперь можешь пользоваться ботом.');
    } else {
        await ctx.editMessageText(
            '❌ Ты еще не подписан на канал. Пожалуйста, подпишись и проверь снова.',
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '📺 Подписаться на канал',
                                url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}`
                            }
                        ],
                        [
                            {
                                text: '🔄 Проверить подписку',
                                callback_data: 'check_subscription'
                            }
                        ]
                    ]
                }
            }
        );
    }
});

bot.use(subscriptionMiddleware);

// Запуск бота
bot.launch().then(() => {
    console.log('Бот запущен!');
    
    if (!CHANNEL_CHAT_ID) {
        console.warn('⚠️ CHANNEL_CHAT_ID не задан! Проверка подписки не будет работать.');
    } else {
        console.log(`✅ Проверка подписки включена для канала: ${CHANNEL_CHAT_ID}`);
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));