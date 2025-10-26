const { Telegraf } = require('telegraf');
require('dotenv').config();
const INTENSIVE = process.env.INTENSIVE;
const CONSULTATION_LINK = process.env.CONSULTATION_LINK;
const EMAIL = process.env.EMAIL;
const BOT_TOKEN = process.env.BOT_TOKEN || '8358954175:AAHRYiUsP8FiQIE4lEoxIHVLxMqmjURHWig';
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || '@your_channel';
const CHANNEL_CHAT_ID = process.env.CHANNEL_CHAT_ID; 
const CHANNEL_LINK = process.env.CHANNEL_LINK;
const bot = new Telegraf(BOT_TOKEN);
const newUsers = new Set();


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
   if (ctx.message 
    && ctx.message.text 
    && (ctx.message.text.startsWith('/towrite') 
        || ctx.message.text.startsWith('/getaconsultation')
        || ctx.message.text.startsWith('/importantinformation')
        || ctx.message.text.startsWith('/intensive'))){
            console.log('ewqeqw')

    return next();
    }

    if (!CHANNEL_CHAT_ID) {
        console.warn('CHANNEL_CHAT_ID не задан, проверка подписки отключена');
        return next();
    }

    const userId = ctx.from.id;
    
    if (newUsers.has(userId)) {
        return next();
    }

    const isSubscribed = await checkSubscription(userId);

    if (!isSubscribed) {
        const username = ctx.from.username || 'пользователь';
        await ctx.reply(
            `📢 Привет @${username}! Для использования бота необходимо подписаться на канал ${CHANNEL_USERNAME}\n\n` +
            `После подписки нажмите кнопку "Проверить подписку"`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '📺 Перейти в канал',
                                url: `https://t.me/${CHANNEL_LINK.replace('@', '')}`
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
bot.use(subscriptionMiddleware);

bot.on('message', async (ctx, next) => {
    if (ctx.message.text && ctx.message.text.startsWith('/')) {
        return next();
    }

    const userId = ctx.from.id;
    
    if (!newUsers.has(userId)) {
        newUsers.add(userId); 
        
        if (!CHANNEL_CHAT_ID) {
            await ctx.reply(
                '⚠️ Бот настроен неправильно. CHANNEL_CHAT_ID не задан.'
            );
            return;
        }
        
        const username = ctx.from.username || 'пользователь';
        const isSubscribed = await checkSubscription(userId);
        
        if (isSubscribed) {
            await ctx.reply('✅ Ты подписан! Сейчас отправлю файл...');
            try {
                await ctx.replyWithDocument({
                    source: './storage/file.pdf',
                    filename: 'Подарок.pdf'
                }, {
                    caption: '🎁 Вот ваш подарок за подписку! Спасибо!'
                });
            } catch (error) {
                console.log('Ошибка при отправке файла:', error.message);
                await ctx.reply('❌ Произошла ошибка при отправке файла.');
            }
        } else {
            await ctx.reply(
                `😃 Ого! Кто у нас тут?\n@${username}, а ты знаешь, что у нас тут раздача подарков?\nЗа подписку на наш Telegram-канал мы дарим подарок!\nСкорее подписывайся и жми кнопку:\n`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '📺 Подписаться на канал',
                                    url: `https://t.me/${CHANNEL_LINK.replace('@', '')}`
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
        return; 
    }
    
    return next();
});

bot.start(async (ctx) => {
    const userId = ctx.from.id;

    if (!newUsers.has(userId)) {
        newUsers.add(userId);
    }
    
    if (!CHANNEL_CHAT_ID) {
        await ctx.reply(
            '⚠️ Бот настроен неправильно. CHANNEL_CHAT_ID не задан.'
        );
        return;
    }
    
    const username = ctx.from.username || 'пользователь';
    const isSubscribed = await checkSubscription(userId);
    
    if (isSubscribed) {
        await ctx.reply('✅ Ты подписан! Сейчас отправлю подарок...');
        try {
            await ctx.replyWithDocument({
                source: './storage/file.pdf',
                filename: 'Подарок.pdf'
            }, {
                caption: '🎁 Вот ваш подарок за подписку! Спасибо!'
            });
        } catch (error) {
            console.log('Ошибка при отправке файла:', error.message);
            await ctx.reply('❌ Произошла ошибка при отправке файла.');
        }
    } else {
        await ctx.reply(
            `😃 Ого! Кто у нас тут?\n@${username}, а ты знаешь, что у нас тут раздача подарков?\nЗа подписку на наш Telegram-канал мы дарим подарок!\nСкорее подписывайся и жми кнопку:\n`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '📺 Подписаться на канал',
                                url: `https://t.me/${CHANNEL_LINK.replace('@', '')}`
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

bot.action('check_subscription', async (ctx) => {
    await ctx.answerCbQuery();
    
    const userId = ctx.from.id;
    const isSubscribed = await checkSubscription(userId);

    if (isSubscribed) {
        if (ctx.callbackQuery.message) {
            await ctx.editMessageText('✅ Ты подписан! Сейчас отправлю файл...');
        } else {
            await ctx.reply('✅ Ты подписан! Сейчас отправлю файл...');
        }
        
        try {
            await ctx.replyWithDocument({
                source: './storage/file.pdf',
                filename: 'Подарок.pdf'
            }, {
                caption: '🎁 Вот ваш подарок за подписку! Спасибо!'
            });
        } catch (error) {
            console.log('Ошибка при отправке файла:', error.message);
            await ctx.reply('❌ Произошла ошибка при отправке файла.');
        }
    } else {
        if (ctx.callbackQuery.message) {
            await ctx.editMessageText(
                '❌ Ты еще не подписан на канал. Пожалуйста, подпишись и проверь снова.',
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '📺 Подписаться на канал',
                                    url: `https://t.me/${CHANNEL_LINK.replace('@', '')}`
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
        } else {
            await ctx.reply(
                '❌ Ты еще не подписан на канал. Пожалуйста, подпишись и проверь снова.',
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '📺 Подписаться на канал',
                                    url: `https://t.me/${CHANNEL_LINK.replace('@', '')}`
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
    }
});

bot.command('towrite', async (ctx) => {

    
    if (EMAIL) {
        await ctx.reply(EMAIL);
    } else {
        await ctx.reply('❌ Email не настроен в системе');
    }
});
bot.command('getaconsultation', async (ctx) => {
    if (CONSULTATION_LINK) {
        await ctx.reply(
            `Ссылка для записи на консультацию: ${CONSULTATION_LINK}`
        );
    } else {
        await ctx.reply('Ссылка отсутсвует');
    }

});
bot.command('intensive',async (ctx) => {
    if (INTENSIVE) {
        await ctx.reply(
            `Все доступные интенсивы: ${INTENSIVE}`
        );
    } else
        await ctx.reply('Ссылка отсутсвует');
})

bot.command('importantinformation', async (ctx) => {
     await ctx.reply(`(FAQ) https://t.me/prostaya_psychologya/78`);
});

bot.command('getagift', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!CHANNEL_CHAT_ID) {
        await ctx.reply('⚠️ Бот настроен неправильно. CHANNEL_CHAT_ID не задан.');
        return;
    }
    
    const isSubscribed = await checkSubscription(userId);
    
    if (isSubscribed) {
        await ctx.reply('✅ Ты подписан! Сейчас отправлю подарок...');
        try {
            await ctx.replyWithDocument({
                source: './storage/file.pdf',
                filename: 'Подарок.pdf'
            }, {
                caption: '🎁 Вот ваш подарок за подписку! Спасибо!'
            });
        } catch (error) {
            console.log('Ошибка при отправке файла:', error.message);
            await ctx.reply('❌ Произошла ошибка при отправке файла.');
        }
    } else {
        const username = ctx.from.username || 'пользователь';
        await ctx.reply(
            `❌ @${username}, для получения подарка необходимо подписаться на канал ${CHANNEL_USERNAME}\n\n` +
            `Подпишитесь и нажмите кнопку проверки:`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '📺 Подписаться на канал',
                                url: `https://t.me/${CHANNEL_LINK.replace('@', '')}`
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